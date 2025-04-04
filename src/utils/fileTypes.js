export const fileTypes = {
    // Dokümanlar
    documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],

    // Tablolar
    spreadsheets: ['.xls', '.xlsx', '.csv', '.ods'],

    // Sunumlar
    presentations: ['.ppt', '.pptx', '.odp'],

    // Görseller
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'],

    // Sıkıştırılmış dosyalar
    archives: ['.zip', '.rar', '.7z'],

    // Programlama dosyaları
    code: ['.js', '.py', '.java', '.c', '.cpp', '.html', '.css'],

    // Diğer
    other: ['.md']
};

// Tüm dosya tipleri için tek bir dizi
export const allAllowedFileTypes = [
    ...fileTypes.documents,
    ...fileTypes.spreadsheets,
    ...fileTypes.presentations,
    ...fileTypes.images,
    ...fileTypes.archives,
    ...fileTypes.code,
    ...fileTypes.other
];
