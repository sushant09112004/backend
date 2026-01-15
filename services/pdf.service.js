import pdfParse from "pdf-parse";

export const extractTextFromPDF = async (buffer) => {
  const data = await pdfParse(buffer);

  return {
    text: data.text,
    pages: data.numpages,
    info: data.info,
  };
};
