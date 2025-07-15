const fs = require('fs');
const path = require('path');
const moment = require('moment');

const REPORT_DIR = '/var/www/html/AFPNewBackendSystem/the_topup_reports';

function cleanOldReportFiles() {
  fs.readdir(REPORT_DIR, (err, files) => {
    if (err) {
      console.error('Error reading report directory:', err);
      return;
    }

    files.forEach(file => {
      // Match your naming pattern e.g. rollback_transaction_report_YYYY-MM-DD_HH-mm-ss.xlsx
      // Adjust the regex if you have different prefixes for other reports
      const match = file.match(/^([a-z_]+)_report_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})\.xlsx$/);
      if (!match) return; // skip files that don't match

      const filePath = path.join(REPORT_DIR, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('Error stating file:', file, err);
          return;
        }

        // Use file creation time or modification time
        const fileTime = moment(stats.ctime); // or stats.mtime
        const now = moment();
        const ageMinutes = now.diff(fileTime, 'minutes');

        if (ageMinutes > 30) {
          fs.unlink(filePath, err => {
            if (err) {
              console.error('Error deleting file:', file, err);
            } else {
              console.log('Deleted old report file:', file);
            }
          });
        }
      });
    });
  });
}
module.exports = cleanOldReportFiles;