import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { THSarabunNew_base64 } from '../assets/fonts/thaiFont';

const exportToCSV = (data, filename) => {
    // Add BOM for Excel to recognize UTF-8
    const BOM = "\uFEFF";

    if (!data || !data.length) {
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(fieldName => {
            let cell = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
            cell = cell.toString().replace(/"/g, '""'); // Escape quotes
            if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
            }
            return cell;
        }).join(','))
    ].join('\n');

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
};

const exportToPDF = (columns, data, filename) => {
    const doc = new jsPDF();

    try {
        // Add the Thai font to VFS and registers it
        doc.addFileToVFS('THSarabunNew.ttf', THSarabunNew_base64);
        doc.addFont('THSarabunNew.ttf', 'THSarabunNew', 'normal');
        doc.setFont('THSarabunNew');

        autoTable(doc, {
            head: [columns.map(col => col.title)],
            body: data.map(row => columns.map(col => row[col.dataIndex] || '')),
            styles: { font: 'THSarabunNew', fontSize: 10 },
            headStyles: { font: 'THSarabunNew', fontSize: 11 }
        });

        doc.save(filename);
    } catch (error) {
        console.error("Error generating PDF with Thai font:", error);
        // Fallback without Thai font
        autoTable(doc, {
            head: [columns.map(col => col.title)],
            body: data.map(row => columns.map(col => row[col.dataIndex] || '')),
        });
        doc.save(filename);
    }
};

const ExportService = {
    exportToCSV,
    exportToPDF
};

export default ExportService;
