import { callDeepSeek } from "@/lib/deepseek";
import type { AIWriteRequest, AIWriteResponse, AIWriteTask } from "@/lib/types";
import { ensureErrorMessage } from "@/lib/utils";
import { createId, mutateDatabase, nowIso } from "@/server/data/database";
import { buildAIContext } from "@/server/services/context-builder.service";

const MODEL_BY_MODE = {
  fast: process.env.DEEPSEEK_FAST_MODEL || "deepseek-v4-flash",
  pro: process.env.DEEPSEEK_PRO_MODEL || "deepseek-v4-pro"
};

export async function runAIWriteTask(
  task: AIWriteTask,
  request: AIWriteRequest
): Promise<AIWriteResponse> {
  const { novel, chapter, messages } = await buildAIContext(task, request);
  const model = MODEL_BY_MODE[request.modelMode ?? defaultModeForTask(task)];
  const jobId = createId();
  const startedAt = nowIso();

  await mutateDatabase((database) => {
    database.aiJobs.unshift({
      id: jobId,
      userId: novel.userId,
      novelId: novel.id,
      chapterId: chapter?.id,
      task,
      status: "running",
      model,
      inputMessages: messages,
      startedAt,
      createdAt: startedAt
    });
  });

  try {
    const result = await callOrMockDeepSeek({
      task,
      model,
      messages,
      request
    });
    const finishedAt = nowIso();

    await mutateDatabase((database) => {
      const job = database.aiJobs.find((item) => item.id === jobId);

      if (job) {
        job.status = "succeeded";
        job.outputText = result.content;
        job.inputTokens = result.usage?.inputTokens;
        job.outputTokens = result.usage?.outputTokens;
        job.finishedAt = finishedAt;
      }
    });

    return {
      jobId,
      content: result.content,
      model,
      usage: result.usage
    };
  } catch (error) {
    const message = ensureErrorMessage(error);

    await mutateDatabase((database) => {
      const job = database.aiJobs.find((item) => item.id === jobId);

      if (job) {
        job.status = "failed";
        job.errorMessage = message;
        job.finishedAt = nowIso();
      }
    });

    throw error;
  }
}

function defaultModeForTask(task: AIWriteTask) {
  if (task === "continue" || task === "generate-outline" || task === "check-consistency") {
    return "pro" as const;
  }

  return "fast" as const;
}

async function callOrMockDeepSeek(params: {
  task: AIWriteTask;
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  request: AIWriteRequest;
}) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return {
      content: createMockAIOutput(params.task, params.request),
      usage: {
        inputTokens: undefined,
        outputTokens: undefined
      }
    };
  }

  const response = await callDeepSeek({
    model: params.model,
    messages: params.messages,
    temperature: 0.82
  });
  const content = response?.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("DeepSeek returned empty content.");
  }

  return {
    content,
    usage: {
      inputTokens: response?.usage?.prompt_tokens,
      outputTokens: response?.usage?.completion_tokens
    }
  };
}

function createMockAIOutput(task: AIWriteTask, request: AIWriteRequest) {
  const selected = request.selectedText?.trim();

  if (task === "rewrite") {
    return selected
      ? `${selected}\n\n（本地预览改写）句式已调整，节奏更紧，情绪转折更清晰。配置 DEEPSEEK_API_KEY 后会返回真实改写结果。`
      : "请先选择需要改写的文本。";
  }

  if (task === "polish") {
    return selected
      ? `${selected}\n\n（本地预览润色）画面细节和动作节奏已增强。配置 DEEPSEEK_API_KEY 后会返回真实润色结果。`
      : "请先选择需要润色的文本。";
  }

  if (task === "expand") {
    return `${selected || "这一段情节"}\n\n（本地预览扩写）人物停顿片刻，环境声慢慢压近，未说出口的念头在动作里显露。配置 DEEPSEEK_API_KEY 后会生成完整扩写。`;
  }

  if (task === "shorten") {
    return selected
      ? `${selected.slice(0, Math.max(40, Math.floor(selected.length * 0.55)))}...`
      : "请先选择需要缩写的文本。";
  }

  if (task === "generate-title") {
    return "雾中的银钥\n旧港来信\n潮声之后\n失物归来\n钥匙齿痕\n凌晨四点的窗";
  }

  if (task === "generate-outline") {
    return "1. 主角追查钥匙来源，发现银砂只在退潮后的钟楼出现。\n2. 旧警署顾问提供一份被涂黑的失踪案卷。\n3. 主角进入地下水道，看见母亲留下的第二枚标记。\n4. 反派势力试图夺走钥匙，暴露银潮夜将至。\n5. 主角选择主动设局，引出守钥组织。";
  }

  if (task === "check-consistency") {
    return "未接入 DeepSeek，当前为本地检查占位：\n- 人物动机需要在关键行动前补一处铺垫。\n- 世界观规则建议保持“银砂只在潮湿环境显现”。";
  }

  return "她把那枚铜钥匙放在掌心，银砂沿着齿纹缓慢亮起。窗外的雾忽然向两侧分开，像有人在街尽头提着一盏灯，耐心地等她走过去。\n\n（本地 AI 预览内容。配置 DEEPSEEK_API_KEY 后会调用真实 DeepSeek 续写。）";
}

