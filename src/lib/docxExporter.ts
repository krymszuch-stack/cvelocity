import type { Paragraph } from 'docx';
import { MasterVault, LayeredFactItem } from '../types';

/**
 * Native Microsoft Word (.docx) Exporter using docx & file-saver
 * Produces ATS-perfect OpenXML document layout with full sections (ADR-56).
 */
export async function downloadNativeDocxCv(
  vault: MasterVault,
  layeredFacts: LayeredFactItem[],
  targetRole: string,
  companyName: string
): Promise<void> {
  const [docx, fileSaverModule] = await Promise.all([
    import('docx'),
    import('file-saver'),
  ]);

  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = docx;
  const saveAs = fileSaverModule.saveAs || fileSaverModule.default || fileSaverModule;

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

  // Education Section (ADR-56)
  if (vault.education && vault.education.length > 0) {
    paragraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: 'WYKSZTAŁCENIE',
            bold: true,
            size: 22,
            color: '0F172A',
            font: 'Calibri',
          }),
        ],
      })
    );
    vault.education.forEach((edu) => {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [
            new TextRun({
              text: `${edu.degree} — ${edu.institution}`,
              bold: true,
              size: 20,
              color: '1E293B',
              font: 'Calibri',
            }),
            new TextRun({
              text: ` (${edu.startDate || ''} - ${edu.endDate || ''})`,
              color: '64748B',
              size: 18,
              font: 'Calibri',
            }),
          ],
        })
      );
    });
  }

  // Certifications Section (ADR-56)
  if (vault.skillsMatrix?.certifications && vault.skillsMatrix.certifications.length > 0) {
    paragraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: 'CERTYFIKATY ZAWODOWE',
            bold: true,
            size: 22,
            color: '0F172A',
            font: 'Calibri',
          }),
        ],
      })
    );
    vault.skillsMatrix.certifications.forEach((cert) => {
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: `${cert.name} — ${cert.issuer}`,
              bold: true,
              size: 20,
              color: '1E293B',
              font: 'Calibri',
            }),
            new TextRun({
              text: cert.date ? ` (${cert.date})` : '',
              size: 18,
              color: '64748B',
              font: 'Calibri',
            }),
          ],
        })
      );
    });
  }

  // Side Projects Section (ADR-56)
  if (vault.projects && vault.projects.length > 0) {
    paragraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: 'PROJEKTY POBOCZNE',
            bold: true,
            size: 22,
            color: '0F172A',
            font: 'Calibri',
          }),
        ],
      })
    );
    vault.projects.forEach((proj) => {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [
            new TextRun({
              text: `${proj.name} — ${proj.role}`,
              bold: true,
              size: 20,
              color: '1E293B',
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: proj.description,
              size: 20,
              color: '334155',
              font: 'Calibri',
            }),
          ],
        })
      );
    });
  }

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
        new TextRun({ text: 'Umiejętności twarde: ', bold: true, size: 20, color: '1E293B', font: 'Calibri' }),
        new TextRun({ text: vault.skillsMatrix.hardSkills.join(', '), size: 20, color: '334155', font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'Narzędzia i technologie: ', bold: true, size: 20, color: '1E293B', font: 'Calibri' }),
        new TextRun({ text: vault.skillsMatrix.toolsAndTech.join(', '), size: 20, color: '334155', font: 'Calibri' }),
      ],
    })
  );

  // Foreign Languages (ADR-56)
  if (vault.profiler?.languages && vault.profiler.languages.length > 0) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: 'Języki obce: ', bold: true, size: 20, color: '1E293B', font: 'Calibri' }),
          new TextRun({
            text: vault.profiler.languages.map((l) => `${l.language} (${l.level})`).join(', '),
            size: 20,
            color: '334155',
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  // RODO Clause
  paragraphs.push(
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
  
  // Format filename: CV_[FullName]_[CompanyName]_[JobTitle].docx
  const cleanName = name.replace(/\s+/g, '_');
  const cleanCompany = (companyName || 'Aplikacja').replace(/\s+/g, '_');
  const cleanTitle = (docTitle || 'Stanowisko').replace(/\s+/g, '_');
  const fileName = `CV_${cleanName}_${cleanCompany}_${cleanTitle}.docx`;

  saveAs(blob, fileName);
}
