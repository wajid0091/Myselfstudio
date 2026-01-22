
export const uploadImageToImgBB = async (file: File): Promise<string | null> => {
    const API_KEY = 'db801e55f83a34710dc37d103f1048a8';
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        if (data.success) {
            return data.data.url;
        } else {
            console.error("ImgBB Error:", data);
            return null;
        }
    } catch (error) {
        console.error("Upload failed:", error);
        return null;
    }
};
