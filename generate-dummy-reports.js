const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const { createCanvas } = require('canvas');
const { execSync } = require('child_process');

const sampleDocsDir = path.join(__dirname, 'sample docs');

// Generate document data
const generateDocumentData = (setNumber, fileNumber) => {
  const doctors = [
    'Dr. Sarah Johnson',
    'Dr. Michael Chen',
    'Dr. Emily Rodriguez',
    'Dr. James Wilson',
    'Dr. Lisa Anderson'
  ];

  const conditions = [
    'Hypertension',
    'Diabetes Mellitus Type 2',
    'Chronic Obstructive Pulmonary Disease',
    'Coronary Artery Disease',
    'Asthma',
    'Pneumonia'
  ];

  const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];

  return {
    title: 'MEDICAL DOCUMENT',
    content: {
      patientName: `Patient ${setNumber}-${fileNumber}`,
      patientId: `P${String(setNumber).padStart(3, '0')}${String(fileNumber).padStart(3, '0')}`,
      date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString(),
      doctor: randomDoctor,
      diagnosis: `Primary diagnosis: ${randomCondition}. Patient presents with stable condition.`,
      findings: `Physical examination reveals normal vital signs. Blood pressure: ${120 + Math.floor(Math.random() * 20)}/${70 + Math.floor(Math.random() * 15)} mmHg. Heart rate: ${60 + Math.floor(Math.random() * 30)} bpm.`,
      medications: ['Metformin 500mg twice daily', 'Lisinopril 10mg once daily', 'Atorvastatin 20mg once daily'],
      recommendations: `Continue current medication regimen. Follow-up appointment scheduled in 2 weeks.`
    }
  };
};

// Generate PDF
const generatePDF = async (setNumber, fileNumber, data, targetDir) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const filename = path.join(targetDir, `Document ${setNumber}-${fileNumber}.pdf`);
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text(data.title, { align: 'center' });
    doc.moveDown();

    // Content
    doc.fontSize(12);
    Object.keys(data.content).forEach(key => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const value = data.content[key];
      if (Array.isArray(value)) {
        doc.fontSize(12).text(`${label}:`, { align: 'left' });
        value.forEach(item => {
          doc.text(`  • ${item}`, { align: 'left' });
        });
      } else {
        doc.fontSize(12).text(`${label}: ${value}`, { align: 'left' });
      }
      doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.fontSize(10).text(`Document generated on ${new Date().toLocaleDateString()}`, { align: 'center' });

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });
};

// Generate Word Document
const generateWord = async (setNumber, fileNumber, data, targetDir) => {
  const paragraphs = [
    new Paragraph({
      text: data.title,
      heading: HeadingLevel.HEADING_1,
      alignment: 'center',
    }),
    new Paragraph({ text: '' })
  ];

  Object.keys(data.content).forEach(key => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const value = data.content[key];
    if (Array.isArray(value)) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${label}:`,
              bold: true,
            }),
          ],
        })
      );
      value.forEach(item => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun(`  • ${item}`),
            ],
          })
        );
      });
    } else {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${label}: `,
              bold: true,
            }),
            new TextRun(String(value)),
          ],
        })
      );
    }
  });

  paragraphs.push(
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Document generated on ${new Date().toLocaleDateString()}`,
          size: 20,
        }),
      ],
      alignment: 'center',
    })
  );

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });

  const filename = path.join(targetDir, `Document ${setNumber}-${fileNumber}.docx`);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filename, buffer);
};

// Generate JPEG
const generateJPEG = async (setNumber, imageNumber, data, targetDir) => {
  const canvas = createCanvas(800, 1200);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 800, 1200);

  // Title
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(data.title, 400, 50);

  let yPos = 100;

  // Content
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  Object.keys(data.content).forEach(key => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`${label}:`, 50, yPos);
    yPos += 25;
    ctx.font = '16px Arial';
    const value = data.content[key];
    if (Array.isArray(value)) {
      value.forEach(item => {
        ctx.fillText(`  • ${item}`, 50, yPos);
        yPos += 25;
      });
    } else {
      const valueStr = String(value);
      const lines = wrapText(ctx, valueStr, 700);
      lines.forEach(line => {
        ctx.fillText(line, 50, yPos);
        yPos += 25;
      });
    }
    yPos += 10;
  });

  // Footer
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Document generated on ${new Date().toLocaleDateString()}`, 400, 1150);

  // Save as JPEG
  const filename = path.join(targetDir, `Document ${setNumber}-${imageNumber}.jpeg`);
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(filename, buffer);
};

// Generate MP4 video (small sized)
const generateMP4 = async (setNumber, videoNumber, data, targetDir) => {
  const filename = path.join(targetDir, `Document ${setNumber}-${videoNumber}.mp4`);
  
  // Create a simple video using ffmpeg
  // First, create a PNG frame from the canvas
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 800, 600);

  // Title
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(data.title, 400, 50);

  let yPos = 100;
  ctx.font = '16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Patient: ${data.content.patientName}`, 50, yPos);
  yPos += 30;
  ctx.fillText(`Date: ${data.content.date}`, 50, yPos);
  yPos += 30;
  ctx.fillText(`Doctor: ${data.content.doctor}`, 50, yPos);
  yPos += 30;
  ctx.fillText(`Diagnosis: ${data.content.diagnosis}`, 50, yPos);

  // Save frame as PNG
  const framePath = path.join(targetDir, `frame_${setNumber}_${videoNumber}.png`);
  const frameBuffer = canvas.toBuffer('image/png');
  fs.writeFileSync(framePath, frameBuffer);

  try {
    // Use ffmpeg to create a small video (3 seconds, low quality for small size)
    // Check if ffmpeg is available
    execSync(`ffmpeg -version`, { stdio: 'ignore' });
    
    // Create video from frame (3 seconds, low bitrate for small size)
    execSync(
      `ffmpeg -y -loop 1 -i "${framePath}" -t 3 -vf "scale=640:480" -c:v libx264 -preset ultrafast -crf 28 -pix_fmt yuv420p -r 1 "${filename}"`,
      { stdio: 'ignore' }
    );
    
    // Clean up frame
    fs.unlinkSync(framePath);
  } catch (error) {
    // If ffmpeg is not available, create a minimal MP4 file placeholder
    // This is a workaround - in production, ffmpeg should be installed
    console.warn(`    ⚠ FFmpeg not found, creating placeholder MP4 file`);
    // Create a minimal valid MP4 header (very small file)
    const minimalMP4 = Buffer.from([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D,
      0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
      0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
    ]);
    fs.writeFileSync(filename, minimalMP4);
    if (fs.existsSync(framePath)) {
      fs.unlinkSync(framePath);
    }
  }
};

// Helper function to wrap text
const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

// Generate all documents
const generateAllDocuments = async () => {
  const numberOfSets = 5;

  console.log('Generating dummy documents...');
  console.log(`Base directory: ${sampleDocsDir}`);

  // Create sample docs folder
  if (!fs.existsSync(sampleDocsDir)) {
    fs.mkdirSync(sampleDocsDir, { recursive: true });
  }

  // Create Sets directly under sample docs
  for (let setNum = 1; setNum <= numberOfSets; setNum++) {
    const setFolderPath = path.join(sampleDocsDir, `Set ${setNum}`);
    if (!fs.existsSync(setFolderPath)) {
      fs.mkdirSync(setFolderPath, { recursive: true });
    }

    // Create type folders under each Set
    const pdfFolderPath = path.join(setFolderPath, 'PDF');
    const wordFolderPath = path.join(setFolderPath, 'Word');
    const mp4FolderPath = path.join(setFolderPath, 'MP4');
    const imagesFolderPath = path.join(setFolderPath, 'Images');

    if (!fs.existsSync(pdfFolderPath)) {
      fs.mkdirSync(pdfFolderPath, { recursive: true });
    }
    if (!fs.existsSync(wordFolderPath)) {
      fs.mkdirSync(wordFolderPath, { recursive: true });
    }
    if (!fs.existsSync(mp4FolderPath)) {
      fs.mkdirSync(mp4FolderPath, { recursive: true });
    }
    if (!fs.existsSync(imagesFolderPath)) {
      fs.mkdirSync(imagesFolderPath, { recursive: true });
    }

    console.log(`\nCreating Set ${setNum}...`);

    // Generate 2 PDFs
    for (let pdfNum = 1; pdfNum <= 2; pdfNum++) {
      try {
        const data = generateDocumentData(setNum, pdfNum);
        await generatePDF(setNum, pdfNum, data, pdfFolderPath);
        console.log(`  ✓ PDF ${pdfNum} generated`);
      } catch (error) {
        console.error(`  ✗ Error generating PDF ${pdfNum}:`, error.message);
      }
    }

    // Generate 2 Word documents
    for (let docxNum = 1; docxNum <= 2; docxNum++) {
      try {
        const data = generateDocumentData(setNum, docxNum + 2);
        await generateWord(setNum, docxNum, data, wordFolderPath);
        console.log(`  ✓ Word document ${docxNum} generated`);
      } catch (error) {
        console.error(`  ✗ Error generating Word ${docxNum}:`, error.message);
      }
    }

    // Generate 2 MP4 videos
    for (let mp4Num = 1; mp4Num <= 2; mp4Num++) {
      try {
        const data = generateDocumentData(setNum, mp4Num + 4);
        await generateMP4(setNum, mp4Num, data, mp4FolderPath);
        console.log(`  ✓ MP4 video ${mp4Num} generated`);
      } catch (error) {
        console.error(`  ✗ Error generating MP4 ${mp4Num}:`, error.message);
      }
    }

    // Generate 3 JPEG images
    for (let imgNum = 1; imgNum <= 3; imgNum++) {
      try {
        const data = generateDocumentData(setNum, imgNum + 6);
        await generateJPEG(setNum, imgNum, data, imagesFolderPath);
        console.log(`  ✓ JPEG image ${imgNum} generated`);
      } catch (error) {
        console.error(`  ✗ Error generating JPEG ${imgNum}:`, error.message);
      }
    }
  }

  console.log('\n\nAll documents generated successfully!');
  console.log(`Files saved in: ${sampleDocsDir}`);
};

// Run the script
generateAllDocuments().catch(console.error);
