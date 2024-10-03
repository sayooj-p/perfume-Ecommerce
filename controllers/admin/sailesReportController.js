const Category = require("../../models/categoryModel")
const Product = require('../../models/productModel')
const User = require('../../models/userModel')
const Order = require('../../models/orderModel');
const excel = require('exceljs');
const PDFDocument = require('pdfkit');




const moment = require('moment');  // Import moment.js

const getSalesPage = async (req, res) => {
    try {
        let search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        // Get filterType and dates from query params
        const filterType = req.query.filterType || 'daily';
        let { startDate, endDate } = req.query;

        // Date filter query initialization
        let dateQuery = {};

        // Prepare date filters based on filterType
        switch (filterType) {
            case 'daily':
                // Today's date range using moment.js
                dateQuery = {
                    $gte: moment().startOf('day').toDate(),
                    $lt: moment().endOf('day').toDate()
                };
                break;

            case 'weekly':
                // Last 7 days using moment.js
                dateQuery = {
                    $gte: moment().startOf('isoWeek').toDate(),
                    $lt: moment().endOf('isoWeek').toDate()
                };
                break;

            case 'yearly':
                // This year's date range using moment.js
                dateQuery = {
                    $gte: moment().startOf('year').toDate(),
                    $lt: moment().endOf('year').toDate()
                };
                break;

            case 'custom':
                if (startDate && endDate) {
                    dateQuery = {
                        $gte: moment(startDate).startOf('day').toDate(),
                        $lt: moment(endDate).endOf('day').toDate()
                    };
                }
                break;

            default:
                // No date filter applied
                break;
        }

        // Aggregations for total order amount and total discount (within date range)
        const overallOrderAmount = await Order.aggregate([
            { $match: { createdOn: dateQuery } },
            { $group: { _id: null, totalAmount: { $sum: "$finalAmount" } } }
        ]);
        const overallDiscount = await Order.aggregate([
            { $match: { createdOn: dateQuery } },
            { $group: { _id: null, totalDiscount: { $sum: "$discount" } } }
        ]);

        // Calculate total amount and discount based on the filtered result
        const totalAmount = overallOrderAmount.length > 0 ? overallOrderAmount[0].totalAmount : 0;
        const totalDiscount = overallDiscount.length > 0 ? overallDiscount[0].totalDiscount : 0;

        // Fetch the filtered sales report with pagination
        const salesReport = await Order.find({
            createdOn: dateQuery
        })
            .sort({ createdOn: -1 }) // Sort by most recent orders
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name email')
            .populate('orderItems.product', 'productName category price')
            .lean();

        // Calculate total sales count for pagination
        const salesCount = await Order.countDocuments({
            createdOn: dateQuery
        });
        const totalPages = Math.ceil(salesCount / limit);

        // Render the report page with the filtered results
        res.render('report', {
            salesCount,
            totalAmount,
            totalDiscount,
            salesReport,
            currentPage: page,
            totalPages,
            limit,
            filterType,
            startDate,
            endDate
        });
    } catch (error) {
        console.log("Error loading sales report:", error);
        res.status(500).send("Internal Server Error");
    }
};


const downloadSalesReportExcel = async (req, res) => {
    try {
        const salesReport = await Order.find({})
            .populate('userId', 'name email')
            .populate('orderItems.product', 'productName category price')
            .lean();

        // Create Excel sheet
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Add headers
        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 20 },
            { header: 'User Name', key: 'userName', width: 30 },
            { header: 'Products', key: 'Products', width: 50 },
            { header: 'Total Amount', key: 'finalAmount', width: 15 },
            { header: 'Discount', key: 'discount', width: 10 },
            { header: 'Coupon Applied', key: 'couponApplied', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 15 },
            { header: 'Order Status', key: 'orderStatus', width: 15 }
        ];

        // Add data
        salesReport.forEach(order => {
            // Check if orderedItems exists and is an array
            const productDetails = Array.isArray(order.orderItems)
                ? order.orderItems.map(item =>
                    `${item.product?.productName || 'Unknown Product'} (${item.quantity})`
                ).join(', ')
                : 'No items';

            worksheet.addRow({
                orderId: order.orderId,
                userName: order.userId ? order.userId.name : 'Guest',
                Products: productDetails,
                finalAmount: order.finalAmount,
                discount: order.discount,
                couponApplied: order.couponApplied ? 'Yes' : 'No',
                paymentMethod: order.paymentMethod,
                orderStatus: order.status
            });
        });

        // Send Excel file as response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');

        return workbook.xlsx.write(res).then(() => {
            res.status(200).end();
        });
    } catch (error) {
        console.log("Error generating Excel:", error);
        res.status(500).send("Internal Server Error");
    }
};



const downloadSalesReportPDF = async (req, res) => {
    try {
        const salesReport = await Order.find({})
            .populate('userId', 'name email')
            .populate('orderItems.product', 'productName category price')
            .lean();

        // Create PDF document
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');

        doc.pipe(res);

        // Add title
        doc.fontSize(18).text('Sales Report', { align: 'center' });
        doc.moveDown(2);

        // Define table structure
        const table = {
            headers: ['Order ID', 'User Name', 'Products', 'Total Amount', 'Discount', 'Coupon Applied', 'Payment Method', 'Order Status'],
            rows: []
        };

        // Populate table rows
        salesReport.forEach(order => {
            const productDetails = Array.isArray(order.orderItems)
                ? order.orderItems.map(item =>
                    `${item.product?.productName || 'Unknown Product'} (${item.quantity})`
                ).join(', ')
                : 'No items';

            table.rows.push([
                order.orderId,
                order.userId ? order.userId.name : 'Guest',
                productDetails,
                `₹${order.finalAmount.toFixed(2)}`,
                `₹${order.discount.toFixed(2)}`,
                order.couponApplied ? 'Yes' : 'No',
                order.paymentMethod,
                order.status
            ]);
        });

        // Draw the table
        drawTable(doc, table);

        doc.end();
    } catch (error) {
        console.log("Error generating PDF:", error);
        res.status(500).send("Internal Server Error");
    }
};

function drawTable(doc, table) {
    const { headers, rows } = table;
    const columnCount = headers.length;
    const columnWidth = (doc.page.width - 60) / columnCount;
    const rowHeight = 30;
    let y = doc.y + 20;

    // Draw headers
    doc.font('Helvetica-Bold').fontSize(10);
    headers.forEach((header, i) => {
        doc.text(header, 30 + (i * columnWidth), y, {
            width: columnWidth,
            align: 'center'
        });
    });

    // Draw a line under the headers
    doc.moveTo(30, y + rowHeight - 5)
       .lineTo(doc.page.width - 30, y + rowHeight - 5)
       .stroke();

    // Draw rows
    doc.font('Helvetica').fontSize(8);
    rows.forEach((row, rowIndex) => {
        y += rowHeight;

        // Start a new page if we're at the bottom
        if (y > doc.page.height - 50) {
            doc.addPage();
            y = 50;
            
            // Redraw headers on new page
            doc.font('Helvetica-Bold').fontSize(10);
            headers.forEach((header, i) => {
                doc.text(header, 30 + (i * columnWidth), y, {
                    width: columnWidth,
                    align: 'center'
                });
            });
            // Draw a line under the headers on the new page
            doc.moveTo(30, y + rowHeight - 5)
               .lineTo(doc.page.width - 30, y + rowHeight - 5)
               .stroke();
            doc.font('Helvetica').fontSize(8);
            y += rowHeight;
        }

        // Draw row
        row.forEach((cell, i) => {
            doc.text(cell, 30 + (i * columnWidth), y, {
                width: columnWidth,
                align: 'center'
            });
        });
    });
}







module.exports = {
    getSalesPage,
    downloadSalesReportExcel,
    downloadSalesReportPDF
}