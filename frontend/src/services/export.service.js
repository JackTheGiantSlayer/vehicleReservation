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

const exportPDF = (columns, data, filename) => {
    const doc = new jsPDF();
    try {
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
        autoTable(doc, {
            head: [columns.map(col => col.title)],
            body: data.map(row => columns.map(col => row[col.dataIndex] || '')),
        });
        doc.save(filename);
    }
};

const exportAdvancedReport = (data, filename) => {
    const doc = new jsPDF();
    const { summary, bookings, top_users, car_stats, daily_stats, chartImage, dateRangeString } = data;

    try {
        doc.addFileToVFS('THSarabunNew.ttf', THSarabunNew_base64);
        doc.addFont('THSarabunNew.ttf', 'THSarabunNew', 'normal');
        doc.setFont('THSarabunNew');

        // 1. Header
        doc.setFontSize(22);
        doc.text("รายงานการใช้รถยนต์ (Advanced Report)", 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text(`ช่วงวันที่: ${dateRangeString || 'ทั้งหมด'}`, 105, 30, { align: 'center' });

        // 2. Summary Section
        doc.setFontSize(16);
        doc.text("สรุปภาพรวม (System Summary)", 14, 45);
        doc.setFontSize(12);
        doc.text(`- ระยะทางรวมทั้งหมด: ${summary.total_mileage} กม.`, 20, 55);
        doc.text(`- จำนวนการจองทั้งหมด: ${summary.total_bookings} รายการ`, 20, 65);
        doc.text(`- สถานะกองยานพาหนะ: พร้อมใช้ ${summary.active_cars} คัน / ทั้งหมด ${summary.total_cars} คัน`, 20, 75);

        let currentY = 85;

        // 3. Visual Chart (New!)
        if (chartImage) {
            doc.setFontSize(16);
            doc.text("กราฟแนวโน้มการใช้งาน (Usage Trend Graph)", 14, currentY);
            // doc.addImage(imageData, format, x, y, width, height)
            // A4 width is 210mm. Using 180mm with 15mm margins.
            doc.addImage(chartImage, 'PNG', 15, currentY + 5, 180, 80);
            currentY += 95;
        }

        // 4. Top 5 Users
        doc.setFontSize(16);
        doc.text("ลำดับผู้ใช้งาน (Top 5 Users)", 14, currentY);
        autoTable(doc, {
            startY: currentY + 5,
            head: [['ชื่อ-นามสกุล', 'จํานวนครั้งที่จอง']],
            body: top_users.map(u => [u.name, u.count]),
            theme: 'striped',
            styles: { font: 'THSarabunNew', fontSize: 10 }
        });

        // 5. Car Usage
        currentY = doc.lastAutoTable.finalY + 15;
        // Check if we need a new page for Car Usage
        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(16);
        doc.text("การใช้รถแยกประเภท (Car Usage & Mileage)", 14, currentY);
        autoTable(doc, {
            startY: currentY + 5,
            head: [['รุ่นรถ/ทะเบียน', 'การจอง', 'ระยะทางรวม']],
            body: car_stats.map(c => [c.name, c.count, `${c.mileage} กม.`]),
            theme: 'striped',
            styles: { font: 'THSarabunNew', fontSize: 10 }
        });

        // 6. Daily Trend Data
        currentY = doc.lastAutoTable.finalY + 15;
        if (currentY > 230) {
            doc.addPage();
            currentY = 20;
        }
        doc.setFontSize(16);
        doc.text("แนวโน้มการจองรายวัน (Daily Booking Trend Data)", 14, currentY);
        autoTable(doc, {
            startY: currentY + 5,
            head: [['วันที่', 'จํานวนการจอง']],
            body: daily_stats.map(d => [d.date, d.bookings]),
            theme: 'grid',
            styles: { font: 'THSarabunNew', fontSize: 9 },
            margin: { left: 14, right: 14 }
        });

        // 7. Detailed Bookings (Separate Page)
        doc.addPage();
        doc.setFontSize(18);
        doc.text("ประวัติการจองฉบับเต็ม (Detailed Booking History)", 105, 20, { align: 'center' });
        autoTable(doc, {
            startY: 30,
            head: [['วันที่', 'ผู้ใช้งาน', 'พาหนะ', 'จุดหมาย', 'สถานะ', 'ระยะทาง']],
            body: bookings.map(b => [
                b.start_time,
                b.user,
                b.car,
                b.destination,
                b.status.toUpperCase(),
                b.mileage > 0 ? `${b.mileage} กม.` : '-'
            ]),
            styles: { font: 'THSarabunNew', fontSize: 9 }
        });

        doc.save(filename);
    } catch (error) {
        console.error("Error generating advanced PDF:", error);
        doc.save(filename);
    }
};

const ExportService = {
    exportToCSV,
    exportToPDF: exportPDF,
    exportAdvancedReport
};

export default ExportService;
