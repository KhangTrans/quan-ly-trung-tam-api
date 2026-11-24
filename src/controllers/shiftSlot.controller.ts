import { Request, Response, NextFunction } from 'express';
import { ShiftSlotService } from '../services/shiftSlot.service';
import { ApiResponse } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';

export class ShiftSlotController {
  static async getAllShiftSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const { period, isActive } = req.query;
      const shiftSlots = await ShiftSlotService.getAllShiftSlots({
        period: period as string,
        isActive: isActive as string,
      });

      ApiResponse.success({
        res,
        data: shiftSlots,
        message: 'Lấy danh sách ca học chuẩn thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getShiftSlotById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const shiftSlot = await ShiftSlotService.getShiftSlotById(id as string);

      ApiResponse.success({
        res,
        data: shiftSlot,
        message: 'Lấy thông tin chi tiết ca học chuẩn thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async createShiftSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const shiftSlot = await ShiftSlotService.createShiftSlot(req.body);

      ApiResponse.success({
        res,
        data: shiftSlot,
        message: 'Thêm ca học chuẩn mới thành công',
        statusCode: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateShiftSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const shiftSlot = await ShiftSlotService.updateShiftSlot(id as string, req.body);

      ApiResponse.success({
        res,
        data: shiftSlot,
        message: 'Cập nhật thông tin ca học chuẩn thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteShiftSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await ShiftSlotService.deleteShiftSlot(id as string);

      ApiResponse.success({
        res,
        data: result,
        message: 'Xóa ca học chuẩn thành công',
      });
    } catch (error) {
      next(error);
    }
  }
}
