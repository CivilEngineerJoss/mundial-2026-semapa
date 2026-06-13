import jsPDF from "jspdf";
import QRCode from "qrcode";
import { getMatchSchedule } from "../data/matchSchedule";
import type { Match, Prediction, PredictionDetail, UserProfile } from "./types";
import { formatDateTime, makeValidationHash } from "./utils";

export async function generatePredictionPdf(args: {
  profile: UserProfile;
  prediction: Prediction;
  matches: Match[];
  details: PredictionDetail[];
}) {
  const { profile, prediction, matches, details } = args;
  const byMatch = new Map(details.map((detail) => [detail.match_id, detail]));
  const code = prediction.confirmation_code ?? "SEMAPA-2026-PENDIENTE";
  const hash = prediction.validation_hash ?? makeValidationHash(`${profile.id}-${code}`);
  const appBase = import.meta.env.VITE_APP_BASE_URL ?? window.location.origin;
  const qr = await QRCode.toDataURL(`${appBase}#/validar/${code}`);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = 44;

  const newPageIfNeeded = (height = 28) => {
    if (y + height > 790) {
      doc.addPage();
      y = 44;
    }
  };

  doc.setFillColor(0, 92, 162);
  doc.rect(0, 0, 595, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("MUNDIAL 2026 - SEMAPA", margin, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Comprobante oficial de pronostico confirmado", margin, y + 22);
  doc.addImage(qr, "PNG", 470, 22, 76, 76);

  y = 126;
  doc.setTextColor(18, 47, 74);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Datos del participante", margin, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  [
    `Nombre: ${profile.full_name}`,
    `Correo: ${profile.email}`,
    `Registro: ${formatDateTime(profile.created_at)}`,
    `Confirmacion: ${formatDateTime(prediction.confirmed_at)}`,
    `Codigo unico: ${code}`,
    `Hash de validacion: ${hash}`,
  ].forEach((line) => {
    doc.text(line, margin, y);
    y += 15;
  });

  let currentPhase = "";
  matches.forEach((match) => {
    newPageIfNeeded();
    if (match.phase !== currentPhase) {
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 92, 162);
      doc.text(match.phase, margin, y);
      y += 18;
      currentPhase = match.phase;
    }
    const detail = byMatch.get(match.id);
    const schedule = getMatchSchedule(match);
    const teamA = schedule?.teamA ?? match.team_a;
    const teamB = schedule?.teamB ?? match.team_b;
    const matchNumber = schedule?.matchNumber ?? match.match_number;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(18, 47, 74);
    doc.setFontSize(9);
    doc.text(
      `${matchNumber.toString().padStart(3, "0")}  ${teamA} ${detail?.predicted_goals_a ?? "-"} - ${detail?.predicted_goals_b ?? "-"} ${teamB}`,
      margin,
      y,
    );
    y += 14;
  });

  newPageIfNeeded(54);
  y += 16;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(72, 91, 110);
  doc.text("Documento generado automaticamente por el sistema MUNDIAL 2026 - SEMAPA", margin, y);
  doc.text(`Fecha de generacion: ${formatDateTime(new Date().toISOString())}`, margin, y + 14);
  doc.save(`pronostico-${code}.pdf`);
}
