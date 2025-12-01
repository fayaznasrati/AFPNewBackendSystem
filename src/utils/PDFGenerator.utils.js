
generatePDFReport = async (title,the_data, filePath) => {
    const PDFDocument = require('pdfkit');
    const fs = require('fs');
     data = the_data || [];
    if( title !="Top Up"){
     data = the_data.results || [];
    }

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // ---- SETTINGS ----
            const rowsPerPage = 20;
            const totalPages = Math.ceil(data.length / rowsPerPage);
            let currentPage = 1;
            let currentRow = 0;

            // ------------------------------------------------------------
            // HEADER FOR FIRST PAGE ONLY
            // ------------------------------------------------------------
            const addHeaderSection = () => {
                const pageWidth = doc.page.width;
                const margin = 40;

                // LOGO LEFT
                const logoPath = '/var/www/html/AFPNewBackendSystem/src/assets/image/logo.png';
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, margin, 30, { width: 80 });
                }

                // TITLE CENTER
                doc.font('Helvetica-Bold')
                   .fontSize(18)
                   .fillColor('#000000')
                   .text(`AfghanPAY ${title} Report`, 0, 35, { align: 'center' });

                // Small info line
                const generatedOn = `Generated on: ${new Date().toLocaleString()}`;
                const totalRecords = `Total Records: ${data.length}`;

                doc.fontSize(10)
                   .font('Helvetica')
                   .text(generatedOn, margin, 80, { align: 'center' });

                doc.text(totalRecords, -margin, 80, { align: 'right' });
                // IMPORTANT FIX: stable start point
                doc.y = 100;  // Table always starts here
            };

            // ---- ADD FIRST PAGE HEADER ----
            addHeaderSection();

            // ------------------------------------------------------------
            // FOOTER (ALL PAGES)
            // ------------------------------------------------------------
          const addFooterToCurrentPage = () => {
                // Page number footer (existing)
                doc.fontSize(8)
                .fillColor('#666666')
                .text(`Page ${currentPage} of ${totalPages}`, 50, 720, { align: 'center' });

                // Only on last page -> print Total Amount
                if (currentPage === totalPages && the_data?.totalAmount) {
                    doc.fontSize(10)
                    .fillColor('#000000')
                    .text(`Total Amount: ${the_data?.totalAmount}`, 50, 700, { align: 'left' });
                     }
                        if (currentPage === totalPages && the_data?.totalDebit) {
                          doc.fontSize(10)
                    .fillColor('#000000')
                    .text(`Total Debit: ${the_data?.totalDebit}`, 50, 700, { align: 'center' });
                        }
                        if (currentPage === totalPages && the_data?.totalCredit) {
                          doc.fontSize(10)
                    .fillColor('#000000')
                    .text( `Total Credit: ${the_data?.totalCredit}`, 50, 700, { align: 'right' });
                }
                
            };


            // ------------------------------------------------------------
            // TABLE SETUP
            // ------------------------------------------------------------
            if (data.length === 0) {
                doc.fontSize(14).text('No data available for the selected criteria.', { align: 'center' });
                addFooterToCurrentPage();
                doc.end();
                return resolve();
            }

            const margin = 50;
            const pageWidth = 612;
            const usableWidth = pageWidth - (2 * margin);

            const originalHeaders = Object.keys(data[0]);
            const headers = ['Sr No', ...originalHeaders];

            const rowHeight = 25;
            const srNoColWidth = 40;
            const otherColsWidth = (usableWidth - srNoColWidth) / (headers.length - 1);
            const colWidths = [srNoColWidth, ...Array(headers.length - 1).fill(otherColsWidth)];

            let yPosition = doc.y;

            // ------------------------------------------------------------
            // TABLE HEADER FUNCTION
            // ------------------------------------------------------------
            const addTableHeaders = () => {
                doc.fontSize(8).font('Helvetica-Bold');
                yPosition = doc.y;

                headers.forEach((header, i) => {
                    const x = margin + colWidths.slice(0, i).reduce((s, w) => s + w, 0);
                    const w = colWidths[i];

                    doc.rect(x, yPosition, w, rowHeight)
                       .fillColor('#006767')
                       .fill();

                    doc.fillColor('#ffffff').text(
                        header.replace(/_/g, ' '),
                        x + 5,
                        yPosition + 8,
                        { width: w - 10, align: 'center' }
                    );
                });

                yPosition += rowHeight;
                doc.moveTo(margin, yPosition).lineTo(pageWidth - margin, yPosition).stroke();
            };

            // ---- FIRST TABLE HEADERS ----
            addTableHeaders();

            // ------------------------------------------------------------
            // ADD TABLE ROWS
            // ------------------------------------------------------------
            doc.fontSize(8).fillColor('#000000').font('Helvetica');

            for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
                currentRow++;

                // PAGE BREAK
                if (currentRow > rowsPerPage) {
                    addFooterToCurrentPage();
                    doc.addPage();
                    currentPage++;
                    currentRow = 1;

                    // NO HEADER HERE — ONLY TABLE HEADER
                    doc.y = 50;
                    addTableHeaders();
                }

                // Alternate row background
                if (rowIndex % 2 === 0) {
                    headers.forEach((header, i) => {
                        const x = margin + colWidths.slice(0, i).reduce((s, w) => s + w, 0);
                        const w = colWidths[i];
                        doc.rect(x, yPosition, w, rowHeight)
                           .fillColor('#f8f9fa')
                           .fill();
                    });
                }

                // Row data
                headers.forEach((header, i) => {
                    const x = margin + colWidths.slice(0, i).reduce((s, w) => s + w, 0);
                    const w = colWidths[i];

                    let value = i === 0 ? (rowIndex + 1).toString() :
                        (data[rowIndex][originalHeaders[i - 1]] ?? '-').toString();

                    doc.fillColor('#000000')
                       .text(value, x + 5, yPosition + 8, {
                           width: w - 10,
                           align: i === 0 ? 'center' : 'left'
                       });
                });

                yPosition += rowHeight;

                doc.moveTo(margin, yPosition).lineTo(pageWidth - margin, yPosition)
                   .strokeColor('#dddddd')
                   .stroke();
            }

            // ---- LAST PAGE FOOTER ----
            addFooterToCurrentPage();

            doc.end();

            stream.on('finish', () => {
                resolve();
            });

        } catch (error) {
            reject(error);
        }
    });
};
module.exports = generatePDFReport;