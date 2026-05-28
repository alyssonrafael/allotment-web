import type Konva from 'konva'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Allotment, EventDetail } from '#/types'
import { SCALE, STATUS_LABELS } from '#/lib/constants'
import { fmtBRL, fmtDateRange } from '#/lib/format'

const JSON_VERSION = '1.0'

/** Slug seguro para nome de arquivo a partir do nome do evento. */
export function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'pavilhao'
  )
}

function triggerDownload(href: string, filename: string): void {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function downloadDataURL(dataUrl: string, filename: string): void {
  triggerDownload(dataUrl, filename)
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  triggerDownload(url, filename)
  URL.revokeObjectURL(url)
}

// ── JSON ─────────────────────────────────────────────────────────────────────

export function buildPavilionJSON(
  event: EventDetail,
  allotments: Array<Allotment>,
  exportedAt: string,
) {
  return {
    version: JSON_VERSION,
    exportedAt,
    event: {
      id: event.id,
      name: event.name,
      type: event.type,
      status: event.status,
      startDate: event.startDate,
      endDate: event.endDate,
      canvasWidth: event.canvasWidth,
      canvasHeight: event.canvasHeight,
      venue: event.venue,
    },
    allotments: allotments.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      x: a.x,
      y: a.y,
      width: a.width,
      height: a.height,
      status: a.status,
      price: a.price,
    })),
  }
}

export function exportPavilionJSON(
  event: EventDetail,
  allotments: Array<Allotment>,
  filename: string,
  exportedAt: string,
): void {
  const data = buildPavilionJSON(event, allotments, exportedAt)
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  downloadBlob(blob, filename)
}

// ── PNG ──────────────────────────────────────────────────────────────────────

/**
 * Exporta o stage inteiro como PNG. A resolução é normalizada pelo zoom atual
 * (`2 / scaleX`) para que a saída tenha sempre ~2× a escala base (SCALE),
 * independente do zoom da viewport.
 */
export function exportPavilionPNG(stage: Konva.Stage, filename: string): void {
  const scale = stage.scaleX() || 1
  const dataUrl = stage.toDataURL({ pixelRatio: 2 / scale })
  downloadDataURL(dataUrl, filename)
}

// ── PDF ──────────────────────────────────────────────────────────────────────

export function exportPavilionPDF(
  stage: Konva.Stage,
  event: EventDetail,
  allotments: Array<Allotment>,
  filename: string,
  exportedAt: string,
): void {
  const scale = stage.scaleX() || 1
  const imgData = stage.toDataURL({ pixelRatio: 2 / scale })

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 12

  // Cabeçalho
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(event.name, margin, 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(110)
  doc.text(
    `${event.venue.name} · ${event.canvasWidth}m × ${event.canvasHeight}m · ${fmtDateRange(event.startDate, event.endDate)}`,
    margin,
    22,
  )
  const generatedAt = new Date(exportedAt).toLocaleString('pt-BR')
  doc.text(`Gerado em ${generatedAt}`, pageWidth - margin, 16, { align: 'right' })
  doc.setTextColor(0)

  // Imagem da planta — escala para caber na largura útil, mantendo proporção
  const imgRatio = (event.canvasWidth * SCALE) / (event.canvasHeight * SCALE)
  const maxImgWidth = pageWidth - margin * 2
  const maxImgHeight = 95
  let imgWidth = maxImgWidth
  let imgHeight = imgWidth / imgRatio
  if (imgHeight > maxImgHeight) {
    imgHeight = maxImgHeight
    imgWidth = imgHeight * imgRatio
  }
  doc.addImage(imgData, 'PNG', margin, 28, imgWidth, imgHeight)

  // Tabela de stands
  autoTable(doc, {
    startY: 28 + imgHeight + 8,
    head: [['Código', 'Nome', 'Área (m²)', 'Status', 'Preço']],
    body: allotments.map((a) => [
      a.code,
      a.name,
      String(a.width * a.height),
      STATUS_LABELS[a.status],
      fmtBRL(a.price),
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    margin: { left: margin, right: margin },
  })

  doc.save(filename)
}
