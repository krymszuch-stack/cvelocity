import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { MasterVault, LayeredFactItem } from '../types';

/**
 * FILAR 3 & ZATWIERDZONE DYREKTYWY:
 * Native Microsoft Word (.docx) Exporter using docx & file-saver
 * Produces ATS-perfect OpenXML document layout.
 */
export async function downloadNativeDocxCv(
  vault: MasterVault,
  layeredFacts: LayeredFactItem[],
  targetRole: string,
  companyName: string
): Promise<void> {
  const docTitle = targetRole || vault.personalInfo.title || 'Specjalista';
  const name = vault.personalInfo.fullName || 'Kandydat';

  const paragraphs: Paragraph[] = [
    // Candidate Name Header
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: name.toUpperCase(),
          bold: true,
          size: 32, // 16pt
          color: '1E293B',
          font: 'Calibri',
        }),
      ],
    }),

    // Subtitle & Company
    new Paragraph({
      spacing: { after: 180 },
      children: [
        new TextRun({
          text: `${docTitle}${companyName ? ' — ' + companyName : ''}`,
          bold: true,
          size: 24, // 12pt
          color: '475569',
          font: 'Calibri',
        }),
      ],
    }),

    // Contact Information Line
    new Paragraph({
      spacing: { after: 240 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
      },
      children: [
        new TextRun({
          text: `E-mail: ${vault.personalInfo.email}  |  Tel: ${vault.personalInfo.phone || 'N/A'}  |  Lokalizacja: ${vault.personalInfo.location || 'Polska'}`,
          size: 18, // 9pt
          color: '64748B',
          font: 'Calibri',
        }),
      ],
    }),

    // Heading: Professional Summary
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: 'PODSUMOWANIE ZAWODOWE',
          bold: true,
          size: 22,
          color: '0F172A',
          font: 'Calibri',
        }),
      ],
    }),

    // Summary Text Body
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: vault.personalInfo.summary || '',
          size: 20, // 10pt
          color: '334155',
          font: 'Calibri',
        }),
      ],
    }),

    // Heading: Work Experience
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: 'DOŚWIADCZENIE ZAWODOWE',
          bold: true,
          size: 22,
          color: '0F172A',
          font: 'Calibri',
        }),
      ],
    }),
  ];

  // Work Experience Entries
  vault.history.forEach((exp) => {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({
            text: `${exp.role.toUpperCase()} — ${exp.company}`,
            bold: true,
            size: 20,
            color: '1E293B',
            font: 'Calibri',
          }),
          new TextRun({
            text: `  (${exp.startDate} - ${exp.endDate})`,
            color: '64748B',
            size: 18,
            font: 'Calibri',
          }),
        ],
      })
    );

    const expFacts = layeredFacts.filter((f) => f.experienceId === exp.id);
    if (expFacts.length > 0) {
      expFacts.forEach((fact) => {
        const text = fact.userOverrideText || fact.jobReframedText || fact.baseText;
        paragraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text,
                size: 20,
                color: '334155',
                font: 'Calibri',
              }),
            ],
          })
        );
      });
    } else {
      exp.highlights.forEach((h) => {
        const hText = typeof h === 'string' ? h : h.text;
        paragraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: hText,
                size: 20,
                color: '334155',
                font: 'Calibri',
              }),
            ],
          })
        );
      });
    }
  });

  // Skills & Tools Section
  paragraphs.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: 'UMIEJĘTNOŚCI I NARZĘDZIA',
          bold: true,
          size: 22,
          color: '0F172A',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'Umiejętności twarde: ', bold: true, size: 20, color: '1E293B' }),
        new TextRun({ text: vault.skillsMatrix.hardSkills.join(', '), size: 20, color: '334155' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({ text: 'Narzędzia i technologie: ', bold: true, size: 20, color: '1E293B' }),
        new TextRun({ text: vault.skillsMatrix.toolsAndTech.join(', '), size: 20, color: '334155' }),
      ],
    }),

    // RODO Clause
    new Paragraph({
      spacing: { before: 240 },
      children: [
        new TextRun({
          text: 'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z rozporządzeniem RODO.',
          size: 16, // 8pt
          color: '94A3B8',
          italics: true,
          font: 'Calibri',
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  
  // Format filename per User Rule 8: CV_[FullName]_[CompanyName]_[JobTitle].docx
  const cleanName = name.replace(/\s+/g, '_');
  const cleanCompany = (companyName || 'Aplikacja').replace(/\s+/g, '_');
  const cleanTitle = (docTitle || 'Stanowisko').replace(/\s+/g, '_');
  const fileName = `CV_${cleanName}_${cleanCompany}_${cleanTitle}.docx`;

  saveAs(blob, fileName);
}
