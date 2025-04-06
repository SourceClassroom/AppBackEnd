import {Assignment} from '../models/assignmentModel.js';

export const createAssignment = async (data) => {
    try {
        return await Assignment.create(data);
    } catch (error) {
        throw error;
    }
};