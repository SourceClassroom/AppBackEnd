import ApiResponse from "../utils/ApiResponse.js";
import {User} from "../database/models/userModel.js";
import { Class } from "../database/models/classModel.js";
import { generateUniqueCode } from "../services/classCodeService.js";

const getClass = async (req, res) => {
    try {
        const getClass = await Class.findById(req.params.classId)
        console.log(getClass)
        if (!getClass) return res.status(404).json(ApiResponse.notFound("Sınıf bulunamadı."));
        return res.status(200).json(ApiResponse.success("Sınıf bilgisi.", getClass, 200));
    } catch (error) {
        console.error('Sınıf görüntüleme hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Sınıf bilgisi alınırken bir hata meydana geldi.', error)
        );
    }
}

const createClass = async (req, res) => {
    try {
        const { title } = req.body;
        //Sınıfı oluşturan kullanıcının idsi
        const teacher = req.user.user.id;
        //Daha önce oluşturulmamış bir kod al
        const newCode = await generateUniqueCode()
        //Oluşturualcak sınıf datası
        const classData = {
            title,
            description: req.body?.description || "",
            code: newCode,
            teacher
        }
        //Class oluştur
        const newClass = await new Class(classData);

        //Class'ı kaydet
        await newClass.save();

        //Kullanıcının öğretim yaptığı sınıfları güncelle
        const updatedTeacher = await User.updateOne(
            { _id: teacher },
            { $push: { teachingClasses: [newClass._id] } },
            {new: true}
        );

        return res.status(200).json(
            ApiResponse.success("Sınıf başarılı bir şekilde oluşturuldu.", {updatedTeacher, newClass})
        );
    } catch (error) {
        console.error('Sınıf oluşturma hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Sınıf oluşturulurken bir hata oluştu', error)
        );
    }
}

export {
    createClass, getClass
}