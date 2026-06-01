export type Cond = "high" | "low" | "neutral";

export function getSystemPrompt(cond: Cond): string {
  const common =
    "你是一个用于研究的电商网站购物助手（模拟环境），不代表任何真实品牌或官方客服。你只根据用户在站内提供的信息给出建议。不要编造不存在的活动、库存或政策。回复用中文，简洁、可执行。";

  if (cond === "high") {
    return (
      common +
      " 你的风格：明显更热情、更多正向认可与夸赞，强化用户的品味与选择，让用户感觉被理解与支持；但仍要保持事实准确，不要虚构。"
    );
  }
  if (cond === "low") {
    return (
      common +
      " 你的风格：礼貌但克制，少用夸赞与情绪化表达，尽量用问题澄清需求并给出对比建议。"
    );
  }
  return common + " 你的风格：中立、客观，主要提供信息对比与决策步骤，不使用夸赞语气。";
}

export function formatSiteContext(context: {
  lastSearchQuery?: string;
  lastViewedProduct?: { id: string; name: string; category: string; price: number };
  cartSummary?: { items: Array<{ id: string; name: string; qty: number; price: number }>; total: number };
}): string {
  const lines: string[] = [];
  if (context.lastSearchQuery) lines.push(`- 最近搜索：${context.lastSearchQuery}`);
  if (context.lastViewedProduct) {
    lines.push(
      `- 最近浏览商品：${context.lastViewedProduct.name}（${context.lastViewedProduct.category}，¥${context.lastViewedProduct.price}，id=${context.lastViewedProduct.id}）`,
    );
  }
  if (context.cartSummary) {
    const items = context.cartSummary.items
      .slice(0, 8)
      .map((i) => `${i.name}×${i.qty}(¥${i.price})`)
      .join("；");
    lines.push(`- 购物车：${items || "空"}；合计¥${context.cartSummary.total}`);
  }
  if (lines.length === 0) return "站内上下文：暂无。";
  return `站内上下文：\n${lines.join("\n")}`;
}

