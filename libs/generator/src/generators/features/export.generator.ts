/**
 * Export Functionality Generator
 *
 * Generates export endpoints for CSV, Excel, and PDF
 * Includes column selection and filtering
 */

import { toPascalCase, toCamelCase } from '../../utils/string.util';
import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';

export interface ExportGeneratorOptions {
  tableName: string;
  formats: ('csv' | 'excel' | 'pdf')[];
  enableFiltering?: boolean;
  maxExportRows?: number;
}

export class ExportGenerator {
  constructor(
    private tableMetadata: TableMetadata,
    private columns: ColumnMetadata[],
    private options: ExportGeneratorOptions,
  ) {}

  /**
   * Generate export endpoints code
   */
  generateEndpoints(): string {
    const entityName = toPascalCase(this.options.tableName);
    const endpoints: string[] = [];

    if (this.options.formats.includes('csv')) {
      endpoints.push(this.generateCSVEndpoint(entityName));
    }

    if (this.options.formats.includes('excel')) {
      endpoints.push(this.generateExcelEndpoint(entityName));
    }

    if (this.options.formats.includes('pdf')) {
      endpoints.push(this.generatePDFEndpoint(entityName));
    }

    return endpoints.join('\n\n');
  }

  /**
   * Generate CSV export endpoint
   */
  private generateCSVEndpoint(entityName: string): string {
    return `  // GENERATED_ENDPOINT_START: export-csv
  @Get('export/csv')
  @ApiOperation({ summary: 'Export to CSV' })
  @ApiQuery({ name: 'columns', required: false, type: String, description: 'Comma-separated column names' })
  async exportCSV(
    @Query() filters: ${entityName}FilterDto,
    @Query('columns') columns?: string,
    @Res() res?: Response,
  ) {
    const data = await this.service.findAll(filters, 1, ${this.options.maxExportRows || 10000});
    const selectedColumns = columns ? columns.split(',') : this.getDefaultExportColumns();
    
    const csvContent = this.generateCSV(data, selectedColumns);
    
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', \`attachment; filename="${this.options.tableName}-\${Date.now()}.csv"\`);
    return res.send(csvContent);
  }
  // GENERATED_ENDPOINT_END: export-csv`;
  }

  /**
   * Generate Excel export endpoint
   */
  private generateExcelEndpoint(entityName: string): string {
    return `  // GENERATED_ENDPOINT_START: export-excel
  @Get('export/excel')
  @ApiOperation({ summary: 'Export to Excel' })
  @ApiQuery({ name: 'columns', required: false, type: String, description: 'Comma-separated column names' })
  async exportExcel(
    @Query() filters: ${entityName}FilterDto,
    @Query('columns') columns?: string,
    @Res() res?: Response,
  ) {
    const data = await this.service.findAll(filters, 1, ${this.options.maxExportRows || 10000});
    const selectedColumns = columns ? columns.split(',') : this.getDefaultExportColumns();
    
    const workbook = await this.generateExcel(data, selectedColumns);
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.header('Content-Disposition', \`attachment; filename="${this.options.tableName}-\${Date.now()}.xlsx"\`);
    return res.send(buffer);
  }
  // GENERATED_ENDPOINT_END: export-excel`;
  }

  /**
   * Generate PDF export endpoint
   */
  private generatePDFEndpoint(entityName: string): string {
    return `  // GENERATED_ENDPOINT_START: export-pdf
  @Get('export/pdf')
  @ApiOperation({ summary: 'Export to PDF' })
  @ApiQuery({ name: 'columns', required: false, type: String, description: 'Comma-separated column names' })
  async exportPDF(
    @Query() filters: ${entityName}FilterDto,
    @Query('columns') columns?: string,
    @Res() res?: Response,
  ) {
    const data = await this.service.findAll(filters, 1, ${this.options.maxExportRows || 10000});
    const selectedColumns = columns ? columns.split(',') : this.getDefaultExportColumns();
    
    const pdfBuffer = await this.generatePDF(data, selectedColumns);
    
    res.header('Content-Type', 'application/pdf');
    res.header('Content-Disposition', \`attachment; filename="${this.options.tableName}-\${Date.now()}.pdf"\`);
    return res.send(pdfBuffer);
  }
  // GENERATED_ENDPOINT_END: export-pdf`;
  }

  /**
   * Generate helper methods for export
   */
  generateHelperMethods(): string {
    return `
  // GENERATED_METHOD_START: export-helpers
  private getDefaultExportColumns(): string[] {
    return [${this.getDefaultColumns()}];
  }

  private generateCSV(data: any[], columns: string[]): string {
    const header = columns.join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return \`"\${value.replace(/"/g, '""')}"\`;
        }
        return value ?? '';
      }).join(',')
    );
    return [header, ...rows].join('\\n');
  }

  private async generateExcel(data: any[], columns: string[]): Promise<any> {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('${this.options.tableName}');
    
    // Add headers
    worksheet.columns = columns.map(col => ({
      header: col.replace(/_/g, ' ').toUpperCase(),
      key: col,
      width: 20,
    }));
    
    // Add data
    data.forEach(row => worksheet.addRow(row));
    
    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    
    return workbook;
  }

  private async generatePDF(data: any[], columns: string[]): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    
    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Title
      doc.fontSize(20).text('${this.tableMetadata.table_name.toUpperCase()} Export', { align: 'center' });
      doc.moveDown();
      
      // Table
      const tableTop = doc.y;
      const colWidth = 500 / columns.length;
      
      // Headers
      doc.fontSize(10).font('Helvetica-Bold');
      columns.forEach((col, i) => {
        doc.text(col.replace(/_/g, ' ').toUpperCase(), 50 + i * colWidth, tableTop, {
          width: colWidth,
          align: 'left',
        });
      });
      
      doc.moveDown();
      
      // Data rows
      doc.font('Helvetica').fontSize(9);
      data.slice(0, 50).forEach((row, rowIndex) => { // Limit to 50 rows for PDF
        const y = doc.y;
        columns.forEach((col, i) => {
          doc.text(String(row[col] ?? ''), 50 + i * colWidth, y, {
            width: colWidth,
            align: 'left',
          });
        });
        doc.moveDown(0.5);
      });
      
      doc.end();
    });
  }
  // GENERATED_METHOD_END: export-helpers
`;
  }

  /**
   * Get default export columns
   */
  private getDefaultColumns(): string {
    const exportColumns = this.columns
      .filter((col) => col.display_in_list && !col.is_primary_key)
      .slice(0, 10) // Limit to 10 columns
      .map((col) => `'${col.column_name}'`);

    return exportColumns.join(', ');
  }

  /**
   * Generate imports for export functionality
   */
  generateImports(): string {
    const imports: string[] = [];

    if (this.options.formats.includes('excel')) {
      imports.push('// npm install exceljs');
    }

    if (this.options.formats.includes('pdf')) {
      imports.push('// npm install pdfkit @types/pdfkit');
    }

    return imports.length > 0
      ? `// Export dependencies:\n${imports.join('\n')}\n`
      : '';
  }
}
