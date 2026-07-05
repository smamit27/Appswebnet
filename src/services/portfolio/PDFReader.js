import * as pdfjsLib from 'pdfjs-dist';

import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export class PDFReader {
  static async read(arrayBuffer, password = '') {
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        password: password
      });
      return await loadingTask.promise;
    } catch (error) {
      if (error.name === 'PasswordException' || error.message.toLowerCase().includes('password') || error.code === 1) {
        throw new Error('INCORRECT_PASSWORD');
      }
      throw new Error('Failed to read PDF document: ' + error.message);
    }
  }
}
