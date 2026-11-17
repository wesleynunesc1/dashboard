// src/utils/formatters.ts

/**
 * Formata moeda BRL completa: R$ 1.148.658.013 ou -R$ 995.319.585
 */
export function formatCurrencyBRL(val: number): string {
  const isNeg = val < 0;
  const abs = Math.abs(val);
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(abs);

  return isNeg ? `-R$ ${formatted}` : `R$ ${formatted}`;
}

/**
 * Formata número com separador de milhar pt-BR (ex: 5.667,5 ou 173.820)
 */
export function formatNumberBR(val: number, decimals: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

/**
 * Formata sinal explícito (+7,4 ou -2,5)
 */
export function formatSignedNumberBR(val: number, decimals: number = 0): string {
  const formatted = formatNumberBR(Math.abs(val), decimals);
  if (val > 0) return `+${formatted}`;
  if (val < 0) return `-${formatted}`;
  return formatted;
}

/**
 * Formata percentual assinado (+0,13% ou -0,34%)
 */
export function formatPercentBR(val: number, decimals: number = 2): string {
  const formatted = formatNumberBR(Math.abs(val), decimals);
  if (val > 0) return `+${formatted}%`;
  if (val < 0) return `-${formatted}%`;
  return `${formatted}%`;
}
