export const fetchReportData = async () => {
    // Mock data
    return [
        { id: 1, name: 'Report 1', date: new Date().toISOString() },
        { id: 2, name: 'Report 2', date: new Date().toISOString() }
    ];
};

export const generatePDFReport = async (data) => {
    // Return a buffer or string representing PDF
    // For now returning a simple string buffer
    return Buffer.from("%PDF-1.4 ... (Mock PDF Data)");
};
