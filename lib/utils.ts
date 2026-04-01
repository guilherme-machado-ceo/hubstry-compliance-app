import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina classes Tailwind de forma segura, resolvendo conflitos
 * @param inputs - Classes CSS ou objetos de classe
 * @returns String de classes CSS merged
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formata uma data para formato legível
 * @param date - Data a ser formatada
 * @param locale - Locale para a formatação (padrão: pt-BR)
 * @returns String formatada
 */
export function formatDate(
  date: Date | string | number,
  locale: string = 'pt-BR'
): string {
  const d = new Date(date)
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Formata um tamanho de arquivo em bytes para leitura humana
 * @param bytes - Tamanho em bytes
 * @returns String formatada (ex: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Retorna a cor base do score de conformidade
 * @param score - Score de 0 a 100
 * @returns Classe Tailwind da cor
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-hubstry-accent'
  if (score >= 60) return 'text-yellow-400'
  return 'text-hubstry-danger'
}

/**
 * Retorna a cor de fundo do score de conformidade
 * @param score - Score de 0 a 100
 * @returns Classe Tailwind da cor de fundo
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-hubstry-accent/10'
  if (score >= 60) return 'bg-yellow-400/10'
  return 'bg-hubstry-danger/10'
}

/**
 * Retorna a cor base da severidade de alerta
 * @param severity - 'info' | 'warning' | 'critical'
 * @returns Classe Tailwind da cor
 */
export function getSeverityColor(
  severity: 'info' | 'warning' | 'critical'
): string {
  switch (severity) {
    case 'critical':
      return 'text-hubstry-danger'
    case 'warning':
      return 'text-yellow-400'
    case 'info':
    default:
      return 'text-hubstry-blue'
  }
}

/**
 * Retorna a cor de fundo da severidade de alerta
 * @param severity - 'info' | 'warning' | 'critical'
 * @returns Classe Tailwind da cor de fundo
 */
export function getSeverityBgColor(
  severity: 'info' | 'warning' | 'critical'
): string {
  switch (severity) {
    case 'critical':
      return 'bg-hubstry-danger/10'
    case 'warning':
      return 'bg-yellow-400/10'
    case 'info':
    default:
      return 'bg-hubstry-blue/10'
  }
}

/**
 * Gera um ID único (simples)
 * @returns String ID único
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Trunca um texto para um comprimento máximo
 * @param text - Texto a ser truncado
 * @param maxLength - Comprimento máximo
 * @param suffix - Sufixo a adicionar (padrão: "...")
 * @returns Texto truncado
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

/**
 * Formata um valor de percentual
 * @param value - Valor decimal (0-1) ou inteiro (0-100)
 * @param decimals - Número de decimais (padrão: 1)
 * @returns String formatada
 */
export function formatPercent(value: number, decimals: number = 1): string {
  const percent = value > 1 ? value : value * 100
  return percent.toFixed(decimals) + '%'
}

/**
 * Valida um email
 * @param email - Email a ser validado
 * @returns Boolean indicando se é válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Pausa a execução por um tempo determinado
 * @param ms - Tempo em milissegundos
 * @returns Promise que resolve após o tempo
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
