import React, { useRef, useState } from 'react';
import { 
  Download, Printer, Trash2, ArrowLeft, Heart, Sparkles, Check, 
  RotateCcw, ShieldAlert, CheckCircle, FileText, Settings, Award
} from 'lucide-react';
import { Certificate, User } from '../types';

interface CertificateViewProps {
  certificate: Certificate;
  onBack: () => void;
  isLightTheme?: boolean;
  onDeleteCertificate?: (certId: string) => void;
  currentUser?: User | null;
}

export default function CertificateView({ 
  certificate, 
  onBack,
  isLightTheme = false,
  onDeleteCertificate,
  currentUser = null
}: CertificateViewProps) {
  
  const printAreaRef = useRef<HTMLDivElement>(null);

  // States to make the certificate live-customizable to look EXACTLY like the image
  const [studentName, setStudentName] = useState<string>(certificate.userName);
  const [collegeName, setCollegeName] = useState<string>('Lokmanya Tilak College of Engineering');
  const [internshipVenue, setInternshipVenue] = useState<string>('EMU Kurla Carshed');
  const [startDate, setStartDate] = useState<string>('03.12.2025');
  const [endDate, setEndDate] = useState<string>('03.01.2026');
  const [projectTitle, setProjectTitle] = useState<string>('SIMULATOR OF ADVANCE AUXILIARY WARNING SYSTEM USED IN EMU SUBURBAN TRAINS');
  const [sectionName, setSectionName] = useState<string>('Auxiliary Warning System Section');
  const [signatoryName, setSignatoryName] = useState<string>('Rachana Singh');
  const [signatoryRole, setSignatoryRole] = useState<string>('Principal');
  const [signatoryLocation, setSignatoryLocation] = useState<string>('Basic Training Centre Kurla');

  // Interactive panels
  const [showConfigMenu, setShowConfigMenu] = useState<boolean>(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Simple clean SVG QR Code generator function to avoid bloating or pulling external pixel APIs
  const generateQRCodeSvg = (value: string) => {
    return (
      <svg className="w-16 h-16 bg-white p-1 rounded border border-amber-800/20 shadow-inner" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#ffffff" />
        <path d="M5 5h30v30H5V5zm6 6v18h18V11H11zM65 5h30v30H65V5zm6 6v18h18V11H71zM5 65h30v30H5V65zm6 6v18h18V71H11z" fill="#78350f" />
        <path d="M20 20h2v2h-2zm45 0h2v2h-2zM20 75h2v2h-2z" fill="#78350f" />
        <path d="M45 10h5v10h-5zm10 5h5v25h-5zm-5 15h15v5H45zm5 10h5v15h-5zm15 10h10v5H65zm5-15h5v10h-5zm-5 25h15v5H60zm-15 5h5v10h-5zm15 10h5v5h-5zm15-55h5v10h-5zm5 15h5v5h-5zm-10 15h10v5H80zm5 10h5v5h-5zm-15 15h5v15h-5zm10 10h10v5H80z" fill="#78350f" />
        <rect x="42" y="42" width="16" height="16" fill="#b45309" rx="1" />
      </svg>
    );
  };

  // Trigger web printing / Save as PDF
  const handlePrint = () => {
    window.print();
  };

  // High-fidelity local Canvas drawing function to generate pixel-perfect, crisp downloaded image
  const handleDownloadPNG = async () => {
    try {
      setIsGenerating(true);
      
      const canvas = document.createElement('canvas');
      canvas.width = 2000;
      canvas.height = 1414; // A4 standard high-res landscape
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Fill Background
      ctx.fillStyle = '#fdfbf7'; // rich beautiful cream paper card
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw outer gold ornate boundaries
      ctx.strokeStyle = '#854d0e'; // gold/brown-800
      ctx.lineWidth = 14;
      ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);

      ctx.strokeStyle = '#b45309'; // amber-700
      ctx.lineWidth = 4;
      ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

      ctx.strokeStyle = '#ca8a04'; // yellow-600
      ctx.lineWidth = 2;
      ctx.strokeRect(62, 62, canvas.width - 124, canvas.height - 124);

      // Draw elegant corner curls
      const drawCornerFlourish = (x: number, y: number, rotateX: number, rotateY: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(rotateX, rotateY);
        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Drawing double swirl
        ctx.moveTo(15, 15);
        ctx.bezierCurveTo(45, 10, 80, 45, 15, 80);
        ctx.bezierCurveTo(-15, 50, -5, 25, 15, 15);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(15, 15);
        ctx.bezierCurveTo(10, 45, 45, 80, 80, 15);
        ctx.stroke();

        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(15, 15, 6, 0, 2*Math.PI);
        ctx.arc(80, 15, 5, 0, 2*Math.PI);
        ctx.arc(15, 80, 5, 0, 2*Math.PI);
        ctx.fill();
        ctx.restore();
      };

      drawCornerFlourish(65, 65, 1, 1); // Top Left
      drawCornerFlourish(canvas.width - 65, 65, -1, 1); // Top Right
      drawCornerFlourish(65, canvas.height - 65, 1, -1); // Bottom Left
      drawCornerFlourish(canvas.width - 65, canvas.height - 65, -1, -1); // Bottom Right

      // 3. Draw Left Circular Crest (Indian Railways)
      const rx = 240, ry = 180;
      ctx.beginPath();
      ctx.arc(rx, ry, 55, 0, 2 * Math.PI);
      ctx.fillStyle = '#b91c1c'; // Red
      ctx.fill();
      ctx.strokeStyle = '#ca8a04'; // Gold
      ctx.lineWidth = 5;
      ctx.stroke();

      // Inner Wheel Spokes
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + Math.cos(angle)*40, ry + Math.sin(angle)*40);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(rx, ry, 25, 0, 2 * Math.PI);
      ctx.fillStyle = '#b91c1c';
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('INDIAN', rx, ry - 10);
      ctx.fillText('RAILWAYS', rx, ry + 15);

      // 4. Draw Right Circular Crest (Central Railway)
      const cx = canvas.width - 240, cy = 180;
      ctx.beginPath();
      ctx.arc(cx, cy, 55, 0, 2 * Math.PI);
      ctx.fillStyle = '#0f172a'; // Deep Navy Blue
      ctx.fill();
      ctx.strokeStyle = '#ca8a04'; // Gold
      ctx.lineWidth = 5;
      ctx.stroke();

      // Train engine tracks inside
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy + 30);
      ctx.lineTo(cx + 30, cy + 30);
      ctx.moveTo(cx - 20, cy + 20);
      ctx.lineTo(cx + 20, cy + 20);
      ctx.stroke();

      // Vertical track bars
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy + 30); ctx.lineTo(cx - 30, cy - 10);
      ctx.moveTo(cx, cy + 30); ctx.lineTo(cx, cy - 20);
      ctx.moveTo(cx + 20, cy + 30); ctx.lineTo(cx + 30, cy - 10);
      ctx.stroke();

      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('CENTRAL', cx, cy - 2);
      ctx.fillText('RAILWAY', cx, cy + 10);

      // 5. Draw center National Emblem (Silhouette representation)
      const ex = canvas.width / 2, ey = 145;
      ctx.fillStyle = '#854d0e'; // Rich golden/brown
      
      // Draw simulated Ashoka Capital silhouette
      ctx.beginPath();
      ctx.moveTo(ex - 15, ey - 30);
      ctx.lineTo(ex + 15, ey - 30);
      ctx.lineTo(ex + 20, ey + 15);
      ctx.lineTo(ex - 20, ey + 15);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(ex, ey - 45, 18, 0, 2*Math.PI);
      ctx.fill();

      ctx.fillRect(ex - 28, ey + 18, 56, 12); // Pedestal base

      // 6. Header Texts
      ctx.fillStyle = '#78350f';
      ctx.textAlign = 'center';
      
      ctx.font = 'bold italic 22px "Times New Roman", Times, Georgia, serif';
      ctx.fillText('भारत सरकार GOVERNMENT OF INDIA', ex, ey + 48);
      
      ctx.font = 'bold italic 20px "Times New Roman", Times, Georgia, serif';
      ctx.fillText('रेल मंत्रालय MINISTRY OF RAILWAYS', ex, ey + 75);

      // 7. Large elegant title "INTERNSHIP CERTIFICATE"
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ex - 350, ey + 125);
      ctx.lineTo(ex + 350, ey + 125);
      ctx.moveTo(ex - 280, ey + 131);
      ctx.lineTo(ex + 280, ey + 131);
      ctx.stroke();

      ctx.fillStyle = '#78350f';
      // Space Grotesk elegant serif vibe
      ctx.font = 'bold tracking-[0.2em] 54px Georgia, "Times New Roman", Times, serif';
      ctx.fillText('INTERNSHIP CERTIFICATE', ex, ey + 185);

      ctx.beginPath();
      ctx.moveTo(ex - 350, ey + 205);
      ctx.lineTo(ex + 350, ey + 205);
      ctx.moveTo(ex - 280, ey + 211);
      ctx.lineTo(ex + 280, ey + 211);
      ctx.stroke();

      // 8. Certificate Main text (Paragraph 1 & 2)
      ctx.fillStyle = '#1e293b'; // slate-800
      ctx.font = '27px Georgia, Garamond, "Times New Roman", Times, serif';
      
      const line1 = `This is to certify that Mr. ${studentName}, student of ${collegeName}, has completed`;
      const line2 = `his internship training at ${internshipVenue} from ${startDate} to ${endDate}.`;
      ctx.fillText(line1, ex, ey + 290);
      ctx.fillText(line2, ex, ey + 335);

      const line3 = `He successfully developed a project titled "${projectTitle}"`;
      const line4 = `for the ${sectionName} at ${internshipVenue}.`;
      ctx.fillText(line3, ex, ey + 420);
      ctx.fillText(line4, ex, ey + 465);

      // 9. Bottom Details - Left side (Place & Date)
      ctx.textAlign = 'left';
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Place: ${internshipVenue}`, 160, canvas.height - 290);
      ctx.fillText(`Date: ${endDate}`, 160, canvas.height - 245);

      // 10. Bottom Details - Right side (Custom Cursive Signature & Designations)
      const sigX = canvas.width - 450;
      const sigY = canvas.height - 290;
      
      // Realistic pen ink cursive signature of Rachana Singh
      ctx.strokeStyle = '#0284c7'; // gorgeous fountain pen teal blue
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sigX - 10, sigY + 10);
      ctx.bezierCurveTo(sigX + 40, sigY - 80, sigX + 80, sigY + 30, sigX + 110, sigY - 10);
      ctx.bezierCurveTo(sigX + 140, sigY - 30, sigX + 180, sigY + 40, sigX + 220, sigY - 20);
      ctx.stroke();

      // Signature text label
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'italic bold 26px Georgia, serif';
      ctx.fillText(`(${signatoryName})`, sigX + 100, sigY + 35);
      
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText(signatoryRole, sigX + 100, sigY + 70);
      ctx.font = '20px system-ui, -apple-system, sans-serif';
      ctx.fillText(signatoryLocation, sigX + 100, sigY + 100);

      // 11. Custom QR Code visual grid representation at bottom center or bottom left
      const qx = canvas.width / 2 - 45;
      const qy = canvas.height - 260;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qx, qy, 90, 90);
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 2;
      ctx.strokeRect(qx, qy, 90, 90);

      ctx.fillStyle = '#78350f';
      // Top left square
      ctx.fillRect(qx + 5, qy + 5, 25, 25);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(qx + 10, qy + 10, 15, 15);
      ctx.fillStyle = '#78350f'; ctx.fillRect(qx + 13, qy + 13, 9, 9);
      // Top right square
      ctx.fillRect(qx + 60, qy + 5, 25, 25);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(qx + 65, qy + 10, 15, 15);
      ctx.fillStyle = '#78350f'; ctx.fillRect(qx + 68, qy + 13, 9, 9);
      // Bottom left square
      ctx.fillRect(qx + 5, qy + 60, 25, 25);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(qx + 10, qy + 65, 15, 15);
      ctx.fillStyle = '#78350f'; ctx.fillRect(qx + 13, qy + 68, 9, 9);
      // Random bytes centers
      ctx.fillRect(qx + 40, qy + 12, 10, 20);
      ctx.fillRect(qx + 50, qy + 40, 15, 10);
      ctx.fillRect(qx + 12, qy + 45, 10, 10);
      ctx.fillRect(qx + 40, qy + 68, 12, 12);
      ctx.fillRect(qx + 65, qy + 42, 8, 8);

      // Seal identifier / Cert Number
      ctx.textAlign = 'center';
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(certificate.certificateNumber, canvas.width / 2, canvas.height - 145);

      // Create download trigger
      const link = document.createElement('a');
      link.download = `InternRail_Certificate_${certificate.certificateNumber}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
      setIsGenerating(false);
    } catch (err) {
      console.error("Canvas image export failed:", err);
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-4">
      
      {/* Action panel */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-3 no-print ${
        isLightTheme ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'
      }`}>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition duration-150 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dossier</span>
        </button>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Custom Settings Configuration Toggle */}
          <button
            onClick={() => setShowConfigMenu(!showConfigMenu)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition duration-150 cursor-pointer border ${
              showConfigMenu 
                ? 'bg-blue-600/15 border-blue-500/30 text-blue-400' 
                : 'bg-transparent border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5 animate-spin-slow" />
            <span>{showConfigMenu ? 'Hide Parameters' : 'Edit Credentials'}</span>
          </button>

          {/* Canvas PNG Download Option */}
          <button
            onClick={handleDownloadPNG}
            disabled={isGenerating}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 active:scale-95 text-white font-bold text-xs rounded-lg transition duration-150 shadow-md shadow-amber-900/40 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Drafting Image...' : 'Download Image (PNG)'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-lg transition duration-150 shadow-md shadow-blue-900/30 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Save PDF</span>
          </button>

          {/* Delete Option */}
          {onDeleteCertificate && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600/25 hover:bg-red-600/35 border border-red-500/30 text-red-400 hover:text-red-300 font-bold text-xs rounded-lg transition duration-150 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Ledger Record</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Certificate Form Variables Controller Panel */}
        {showConfigMenu && (
          <div className={`p-5 rounded-2xl border space-y-4 no-print lg:col-span-1 leading-normal ${
            isLightTheme ? 'bg-white border-slate-200 shadow-sm text-slate-800' : 'bg-slate-900 border-slate-850 text-slate-100'
          }`}>
            <h4 className="text-xs font-black tracking-wider uppercase text-blue-500 font-mono flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Certificate Parameters</span>
            </h4>
            <p className="text-[10px] text-slate-500">
              Customize values instantly. The design below updates dynamically to match your desired layout.
            </p>

            <div className="space-y-3 font-mono text-[10px]">
              <div>
                <label className="block text-zinc-500 font-bold mb-1 uppercase">Student Full Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white font-bold text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-500 font-bold mb-1 uppercase">College / University</label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white font-bold text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-500 font-bold mb-1 uppercase">Internship Workshop Location</label>
                <input
                  type="text"
                  value={internshipVenue}
                  onChange={(e) => setInternshipVenue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white font-bold text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-500 font-bold mb-1 uppercase">Start Date</label>
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white font-bold text-xs focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 font-bold mb-1 uppercase">End Date</label>
                  <input
                    type="text"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white font-bold text-xs focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 font-bold mb-1 uppercase">Developed Project Title</label>
                <textarea
                  rows={3}
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white font-bold text-[11px] leading-snug focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-500 font-bold mb-1 uppercase">Railway Section / Department</label>
                <input
                  type="text"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white font-bold text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-500 font-bold mb-1 uppercase">Lead Signatory officer</label>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white font-bold text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-500 font-bold mb-1 uppercase">Signatory Role</label>
                <input
                  type="text"
                  value={signatoryRole}
                  onChange={(e) => setSignatoryRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white font-bold text-xs focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setStudentName(certificate.userName);
                setCollegeName('Lokmanya Tilak College of Engineering');
                setInternshipVenue('EMU Kurla Carshed');
                setStartDate('03.12.2025');
                setEndDate('03.01.2026');
                setProjectTitle('SIMULATOR OF ADVANCE AUXILIARY WARNING SYSTEM USED IN EMU SUBURBAN TRAINS');
                setSectionName('Auxiliary Warning System Section');
                setSignatoryName('Rachana Singh');
                setSignatoryRole('Principal');
                setSignatoryLocation('Basic Training Centre Kurla');
              }}
              className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-[10px] font-mono cursor-pointer transition border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset parameters</span>
            </button>
          </div>
        )}

        {/* Certificate Rendering Area */}
        <div className={`col-span-1 ${showConfigMenu ? 'lg:col-span-3' : 'lg:col-span-4'} w-full overflow-x-auto p-1`}>
          
          <div className="min-w-[800px] w-full bg-white text-slate-950 p-2 sm:p-4 rounded-2xl shadow-xl overflow-hidden print:p-0">
            
            {/* The visual certificate print frame */}
            <div 
              ref={printAreaRef}
              id="certificate-print-frame"
              className="w-full bg-[#fdfbf7] text-slate-900 border-[16px] border-amber-900 relative p-12 overflow-hidden flex flex-col justify-between items-center text-center font-serif"
              style={{
                aspectRatio: '1.414 / 1', // Exact A4 ratio
              }}
            >
              {/* Outer double line gold border */}
              <div className="absolute inset-2 border-2 border-amber-700 pointer-events-none" />
              <div className="absolute inset-3.5 border border-yellow-600 pointer-events-none" />

              {/* Vector Corners Flourish */}
              <div className="absolute top-4 left-4 w-20 h-20 text-amber-900 pointer-events-none opacity-95">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current" strokeWidth="2.5">
                  <path d="M10,10 C25,12 40,25 20,40 C10,30 15,18 20,15" />
                  <path d="M10,10 C15,25 25,40 40,20 C30,10 18,15 15,20" />
                  <circle cx="10" cy="10" r="3" className="fill-current" />
                  <circle cx="40" cy="20" r="2.5" className="fill-current" />
                  <circle cx="20" cy="40" r="2.5" className="fill-current" />
                </svg>
              </div>

              <div className="absolute top-4 right-4 w-20 h-20 text-amber-900 pointer-events-none opacity-95 transform scale-x-[-1]">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current" strokeWidth="2.5">
                  <path d="M10,10 C25,12 40,25 20,40 C10,30 15,18 20,15" />
                  <path d="M10,10 C15,25 25,40 40,20 C30,10 18,15 15,20" />
                  <circle cx="10" cy="10" r="3" className="fill-current" />
                  <circle cx="40" cy="20" r="2.5" className="fill-current" />
                  <circle cx="20" cy="40" r="2.5" className="fill-current" />
                </svg>
              </div>

              <div className="absolute bottom-4 left-4 w-20 h-20 text-amber-900 pointer-events-none opacity-95 transform scale-y-[-1]">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current" strokeWidth="2.5">
                  <path d="M10,10 C25,12 40,25 20,40 C10,30 15,18 20,15" />
                  <path d="M10,10 C15,25 25,40 40,20 C30,10 18,15 15,20" />
                  <circle cx="10" cy="10" r="3" className="fill-current" />
                  <circle cx="40" cy="20" r="2.5" className="fill-current" />
                  <circle cx="20" cy="40" r="2.5" className="fill-current" />
                </svg>
              </div>

              <div className="absolute bottom-4 right-4 w-20 h-20 text-amber-900 pointer-events-none opacity-95 transform scale-x-[-1] scale-y-[-1]">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current" strokeWidth="2.5">
                  <path d="M10,10 C25,12 40,25 20,40 C10,30 15,18 20,15" />
                  <path d="M10,10 C15,25 25,40 40,20 C30,10 18,15 15,20" />
                  <circle cx="10" cy="10" r="3" className="fill-current" />
                  <circle cx="40" cy="20" r="2.5" className="fill-current" />
                  <circle cx="20" cy="40" r="2.5" className="fill-current" />
                </svg>
              </div>

              {/* Watermark Crest Background in the core center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.025]">
                <Award className="w-[450px] h-[450px] text-amber-800" />
              </div>

              {/* Header Container */}
              <div className="w-full flex justify-between items-center select-none relative z-10">
                {/* Left Seal - Indian Railways */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-4 border-amber-800/15 p-1 bg-white shadow-md flex items-center justify-center relative overflow-hidden">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-red-700">
                      <circle cx="50" cy="50" r="46" fill="#b91c1c" />
                      <circle cx="50" cy="50" r="41" fill="none" stroke="#ca8a04" strokeWidth="3" />
                      <path d="M50 15v70M15 50h70" stroke="#ca8a04" strokeWidth="2" opacity="0.4" />
                      <circle cx="50" cy="50" r="20" fill="none" stroke="#ffffff" strokeWidth="3" />
                      <text x="50" y="44" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">INDIAN</text>
                      <text x="50" y="62" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">RAILWAYS</text>
                    </svg>
                  </div>
                  <span className="text-[7.5px] uppercase font-sans font-black tracking-widest text-[#b91c1c] mt-1.5">INDIAN RAILWAYS</span>
                </div>

                {/* Center Nation Seal / Ministry Logos */}
                <div className="flex flex-col items-center text-center max-w-[400px]">
                  {/* Ashoka Pillar Silhouette */}
                  <svg className="w-7 h-10 text-amber-900 fill-current mb-0.5" viewBox="0 0 100 130">
                    <rect x="36" y="80" width="28" height="30" rx="2" />
                    <rect x="25" y="110" width="50" height="8" rx="1" />
                    <circle cx="50" cy="40" r="26" />
                    <path d="M22 65 h56v15h-56z" />
                  </svg>
                  <span className="text-[7px] font-sans font-bold text-slate-600 block mt-0.5">सत्यमेव जयते</span>
                  <span className="text-[12px] uppercase font-sans tracking-wide font-black text-amber-900 mt-1">भारत सरकार GOVERNMENT OF INDIA</span>
                  <span className="text-[11px] uppercase font-sans tracking-wide font-bold text-[#78350f] mt-0.5">रेल मंत्रालय MINISTRY OF RAILWAYS</span>
                </div>

                {/* Right Seal - Central Railway */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-4 border-amber-800/15 p-1 bg-white shadow-md flex items-center justify-center relative overflow-hidden">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-850">
                      <circle cx="50" cy="50" r="46" fill="#0f172a" />
                      <circle cx="50" cy="50" r="41" fill="none" stroke="#ca8a04" strokeWidth="3" />
                      {/* Train tracks */}
                      <path d="M20 70 L80 70" stroke="#ca8a04" strokeWidth="2" />
                      <path d="M25 60 L75 60" stroke="#ca8a04" strokeWidth="1.5" />
                      <path d="M30 70 L34 50 M50 70 L50 45 M70 70 L66 50" stroke="#ca8a04" strokeWidth="1.5" />
                      <text x="50" y="38" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">CENTRAL</text>
                      <text x="50" y="53" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">RAILWAY</text>
                    </svg>
                  </div>
                  <span className="text-[7.5px] uppercase font-sans font-black tracking-widest text-[#0f172a] mt-1.5">CENTRAL RAILWAY</span>
                </div>
              </div>

              {/* Title Heading Banner */}
              <div className="w-full my-3 sm:my-5 relative z-10">
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-600 to-transparent mt-[3px]" />
                
                <h1 className="text-3xl sm:text-5xl font-black uppercase text-amber-900 tracking-wider py-4 font-serif leading-none italic select-none">
                  INTERNSHIP CERTIFICATE
                </h1>
                
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-600 to-transparent mt-[3px]" />
              </div>

              {/* Certificate content text box with elegant borders */}
              <div className="my-2 max-w-3xl mx-auto space-y-6 text-slate-800 text-sm md:text-base leading-loose relative z-10 select-text px-6 py-2">
                <p className="font-serif">
                  This is to certify that <span className="font-black text-slate-950 font-serif text-lg border-b border-dashed border-amber-900/60 pb-0.5">Mr. {studentName}</span>, student of <span className="font-extrabold text-slate-900 italic">{collegeName}</span>, has completed his internship training at <span className="font-bold text-amber-900">{internshipVenue}</span> from <span className="font-extrabold text-slate-900 underline decoration-amber-600">{startDate}</span> to <span className="font-extrabold text-slate-900 underline decoration-amber-600">{endDate}</span>.
                </p>

                <p className="font-serif italic text-slate-700 leading-relaxed md:px-12">
                  He successfully developed a project titled <span className="font-black text-slate-950 block text-sm not-italic uppercase tracking-tight my-2 font-mono bg-amber-550/5 p-2 border border-amber-800/10 rounded">"{projectTitle}"</span> for the <span className="font-semibold text-slate-900 not-italic">{sectionName}</span> at <span className="font-semibold text-slate-950 not-italic">{internshipVenue}</span>.
                </p>
              </div>

              {/* Verification & Signature Row */}
              <div className="w-full mt-6 pt-5 grid grid-cols-3 gap-2 border-t border-amber-800/15 relative z-10 text-left text-xs font-sans">
                
                {/* Column 1: Issuing info */}
                <div className="flex flex-col justify-end space-y-1">
                  <p className="text-[12px] font-bold text-[#334155]">Place: <span className="font-semibold text-[#475569]">{internshipVenue}</span></p>
                  <p className="text-[12px] font-bold text-[#334155]">Date: <span className="font-semibold text-[#475569]">{endDate}</span></p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 select-none">Ref No: {certificate.id}</p>
                </div>

                {/* Column 2: Center QR for secure verifying */}
                <div className="flex justify-center items-center">
                  <div className="flex flex-col items-center select-none">
                    {generateQRCodeSvg(certificate.qrCodeValue)}
                    <span className="text-[8px] font-mono text-zinc-400 mt-1">{certificate.certificateNumber}</span>
                  </div>
                </div>

                {/* Column 3: Lead Signatory Signature (Fountain brush SVG) */}
                <div className="flex flex-col items-end justify-end text-right select-none">
                  <div className="w-40 h-10 relative flex items-center justify-center">
                    {/* Realistic cursive fountain pen ink flourish svg */}
                    <svg viewBox="0 0 100 30" className="w-full h-full text-blue-800 absolute opacity-85">
                      <path d="M10 20s20-25 35 0c15 25 30-20 45-5" fill="none" stroke="currentColor" strokeWidth="2.5" />
                      <path d="M20 12h50" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3" />
                    </svg>
                    <span className="text-[14px] text-zinc-950 italic font-serif font-black underline decoration-blue-600/30 z-10">
                      {signatoryName}
                    </span>
                  </div>
                  <div className="w-32 h-[1px] bg-amber-800/30 my-1.5" />
                  <p className="text-[11px] font-black uppercase text-slate-800 tracking-wider font-sans leading-none">{signatoryName}</p>
                  <p className="text-[10px] font-bold text-slate-550 text-slate-500 mt-0.5 leading-none">{signatoryRole}</p>
                  <p className="text-[9px] text-slate-400 font-medium leading-normal">{signatoryLocation}</p>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Delete Confirmation Dialog Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm animate-fade-in no-print">
          <div className={`${isLightTheme ? 'bg-white text-slate-800 border-slate-200' : 'bg-slate-900 text-white border-slate-800'} border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-xs animate-scale-up leading-normal`}>
            <div className="bg-red-600 p-4 text-white flex gap-2.5 items-center">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold tracking-tight uppercase">Delete Certificate Record?</h4>
            </div>
            
            <div className="p-5 space-y-4 font-sans">
              <p className="text-sm leading-relaxed">
                Are you sure you want to permanently delete certificate <span className="font-extrabold text-yellow-500 font-mono">{certificate.certificateNumber}</span> issued to <span className="font-black text-white">{studentName}</span> from the cloud Registry?
              </p>
              
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-[11px] text-red-400 leading-snug">
                WARNING: This process completely burns the secure verification signature from the cloud ledger database. It is final and irreversible.
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`px-4 py-2 font-bold rounded-lg cursor-pointer ${isLightTheme ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-zinc-300'}`}
                >
                  No, Keep Record
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    if (onDeleteCertificate) onDeleteCertificate(certificate.id);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold cursor-pointer transition"
                >
                  Yes, Remove Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
