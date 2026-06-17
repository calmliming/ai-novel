import type { AIWriteTask } from "@/lib/types";

const aiTaskLabels: Record<AIWriteTask, string> = {
  continue: "续写",
  rewrite: "改写",
  polish: "润色",
  expand: "扩写",
  shorten: "缩写",
  "generate-title": "标题",
  "generate-outline": "大纲",
  "check-consistency": "一致性"
};

export function aiTaskLabel(task: AIWriteTask) {
  return aiTaskLabels[task] ?? task;
}
