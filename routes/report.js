import { fetchReportData, generatePDFReport } from '../services/reportService.js';

export default async function (fastify, opts) {
  fastify.get('/reports', async (request, reply) => {
    try {
      const data = await fetchReportData();
      return { status: 'OK', data };
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/reports/pdf', async (request, reply) => {
    try {
      const pdfBuffer = await generatePDFReport();
      reply.header('Content-Type', 'application/pdf');
      reply.send(pdfBuffer);
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });
}
