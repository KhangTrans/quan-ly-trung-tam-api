import { ShiftSlot, IShiftSlot } from '../models/shiftSlot.model';
import { AppError } from '../utils/appError';
import { HTTP_STATUS } from '../constants/httpStatus';

export class ShiftSlotService {
  static async getAllShiftSlots(query?: { period?: string; isActive?: boolean | string }) {
    const filter: Record<string, any> = {};

    if (query?.period) {
      filter.period = query.period;
    }

    if (query?.isActive !== undefined && query.isActive !== '') {
      filter.isActive = String(query.isActive) === 'true';
    }

    return await ShiftSlot.find(filter).sort({ period: 1, startTime: 1 });
  }

  static async getShiftSlotById(id: string) {
    const shiftSlot = await ShiftSlot.findById(id);
    if (!shiftSlot) {
      throw new AppError('Không tìm thấy ca học chuẩn', HTTP_STATUS.NOT_FOUND);
    }
    return shiftSlot;
  }

  static async createShiftSlot(data: Partial<IShiftSlot>) {
    return await ShiftSlot.create(data);
  }

  static async updateShiftSlot(id: string, data: Partial<IShiftSlot>) {
    const shiftSlot = await ShiftSlot.findById(id);
    if (!shiftSlot) {
      throw new AppError('Không tìm thấy ca học chuẩn', HTTP_STATUS.NOT_FOUND);
    }

    Object.assign(shiftSlot, data);
    await shiftSlot.save();
    return shiftSlot;
  }

  static async deleteShiftSlot(id: string) {
    const shiftSlot = await ShiftSlot.findById(id);
    if (!shiftSlot) {
      throw new AppError('Không tìm thấy ca học chuẩn', HTTP_STATUS.NOT_FOUND);
    }

    await ShiftSlot.findByIdAndDelete(id);
    return { id, message: 'Đã xóa ca học chuẩn thành công' };
  }
}
