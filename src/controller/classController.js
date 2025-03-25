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


/**
 * Sınıf oluşturma
 * @route POST /api/class/create
 * @access Private [Teacher/sysadmin]
 */
const createClass = async (req, res) => {
    try {
        const { title } = req.body;
        //Sınıfı oluşturan kullanıcının idsi
        const teacher = req.user.id;
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

        return res.status(201).json(
            ApiResponse.success("Sınıf başarılı bir şekilde oluşturuldu.", {updatedTeacher, newClass})
        );
    } catch (error) {
        console.error('Sınıf oluşturma hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Sınıf oluşturulurken bir hata oluştu', error)
        );
    }
}


/**
 * Sınıfa katılma
 * @route POST /api/class/join
 * @access Private
 */
const joinClass = async (req, res) => {
    try {
        const classCode = req.params.classCode;
        const userId = req.user.id;
        //Get Class Data
        const getClassData = await Class.findOne({code: classCode})
        //Check Class is avalible
        if (!getClassData) {
            return res.status(404).json(ApiResponse.notFound("Böyle bir sınıf bulunamadı."))
        }
        if (getClassData.forbiddenStudents.includes(userId)) return res.status(403).json(ApiResponse.forbidden("Bu sınıfa katılma izniniz yok."))
        //Get user data
        const userData = await User.findById(userId)
        //Check for user already member of class
        if (userData.enrolledClasses.includes(getClassData._id) || userData.teachingClasses.includes(getClassData._id)) {
            return res.status(400).json(ApiResponse.error("Kullanıcı zaten bu sınıfa üye.",  null, 400))
        }
        //Update class students
        const updateClass = await Class.findByIdAndUpdate(getClassData._id, { $push: { students: [userData._id] } }, {new: true})
        //Update user classes
        const updateUser = await User.findByIdAndUpdate(userId, { $push: { enrolledClasses: [getClassData._id] } }, {new: true})
        //return data
        res.status(200).json(ApiResponse.success("Başarıyla sınıfa katılındı.", {updateUser, updateClass}, 200))
    } catch (error) {
        console.error('Sınıf katılma hatası:', error);
        res.status(500).json(
            ApiResponse.serverError('Sınıfa katılırken bir hata meydana geldi', error)
        );
    }
}

/**
 * Öğrenci at
 * @route POST /api/class/kick/:classId/:userId
 * @access Private [Class Teacher/sysadmin]
 */
const kickStudent = async (req, res) => {
    try {
        const userId = req.params.userId;
        const classId = req.params.classId;

        // Sınıf verisini al
        const getClassData = await Class.findById(classId);
        if (!getClassData) {
            return res.status(404).json(ApiResponse.notFound("Böyle bir sınıf bulunamadı."));
        }

        // Kullanıcı verisini al
        const userData = await User.findById(userId);
        if (!userData) {
            return res.status(404).json(ApiResponse.notFound("Böyle bir kullanıcı bulunamadı."));
        }

        // Kullanıcı gerçekten sınıfın bir üyesi mi kontrol et
        if (
            !userData.enrolledClasses.includes(getClassData._id) ||
            !getClassData.students.includes(userData._id)
        ) {
            return res.status(400).json(ApiResponse.error("Kullanıcı bu sınıfın üyesi değil", null, 400));
        }

        // Kullanıcıdan sınıfı kaldır
        userData.enrolledClasses = userData.enrolledClasses.filter(
            (classRef) => classRef.toString() !== getClassData._id.toString()
        );
        const newUserData = await userData.save();

        // Sınıftan kullanıcıyı kaldır
        getClassData.students = getClassData.students.filter(
            (studentRef) => studentRef.toString() !== userData._id.toString()
        );
        const newClassData = await getClassData.save();

        return res.status(200).json(ApiResponse.success("Kullanıcı sınıftan başarıyla çıkarıldı.", {newClassData, newUserData}));
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json(
            ApiResponse.serverError('Bir hata meydana geldi', error)
        );
    }
};

/**
 * Öğrenci yasakla
 * @route POST /api/class/kick/:classId/:userId
 * @access Private [Class Teacher/sysadmin]
 */
const banStudent = async (req, res) => {
    try {
        const userId = req.params.userId;
        const classId = req.params.classId;

        // Sınıf verisini al
        const getClassData = await Class.findById(classId);
        if (!getClassData) {
            return res.status(404).json(ApiResponse.notFound("Böyle bir sınıf bulunamadı."));
        }

        // Kullanıcı verisini al
        const userData = await User.findById(userId);
        if (!userData) {
            return res.status(404).json(ApiResponse.notFound("Böyle bir kullanıcı bulunamadı."));
        }

        // Kullanıcı gerçekten sınıfın bir üyesi mi kontrol et
        if (
            !userData.enrolledClasses.includes(getClassData._id) ||
            !getClassData.students.includes(userData._id)
        ) {
            return res.status(400).json(ApiResponse.error("Kullanıcı bu sınıfın üyesi değil", null, 400));
        }

        // Kullanıcıdan sınıfı kaldır
        userData.enrolledClasses = userData.enrolledClasses.filter(
            (classRef) => classRef.toString() !== getClassData._id.toString()
        );
        const newUserData = await userData.save();

        // Sınıftan kullanıcıyı kaldır
        getClassData.students = getClassData.students.filter(
            (studentRef) => studentRef.toString() !== userData._id.toString()
        );
        getClassData.forbiddenStudents.push(userData._id);

        const newClassData = await getClassData.save();

        return res.status(200).json(ApiResponse.success("Kullanıcı sınıftan başarıyla çıkarıldı.", {newClassData, newUserData}));
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json(
            ApiResponse.serverError('Bir hata meydana geldi', error)
        );
    }
};
//TODO fonksiyonu test et
/** Sınıftaki öğrencilerin bilgilerini döner
 * @param {*} req 
 * @param {*} res 
 */
const studentList = async (req, res) => {
    try {
        const classId = req.params.classId

        // Sınıf verisini al
        const getClassData = await Class.findById(classId);
        if (!getClassData) {
            return res.status(404).json(ApiResponse.notFound("Böyle bir sınıf bulunamadı."));
        }
        
        const classStudentData = await Class.aggregate([
            {
              $match: { _id: classId } // Belirli bir grubu seç
            },
            {
              $lookup: {
                from: "users",
                localField: "userIds",
                foreignField: "_id",
                as: "userDetails"
              }
            },
            {
              $project: {
                _id: 0,
                users: {
                  $map: {
                    input: "$userDetails",
                    as: "user",
                    in: {
                      name: "$$user.name",
                      surname: "$$user.surname",
                      email: "$$user.email",
                      profile: "$$user.profile"
                    }
                  }
                }
              }
            }
          ])
          if (!classStudentData || classStudentData.length === 0) {
            return res.status(404).json(ApiResponse.notFound("Bu sınıfa kayıtlı öğrenci bulunamadı."));
          }
          return res.status(200).json(ApiResponse.success("Sınıftaki öğrenci verisi", classStudentData, 200))
    } catch (error) {
        console.error('Öğrenci bilgileri alınırken bir hata meydana geldi.:', error);
        res.status(500).json(
            ApiResponse.serverError('Öğrenci bilgileri alınırken bir hata meydana geldi.', error)
        );
    }
}

export {
    createClass, getClass, joinClass,
    kickStudent, banStudent, studentList
}