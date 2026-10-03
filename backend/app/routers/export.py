from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import SchedulePeriod, ScheduleDay, ShiftAssignment
from app.engine.coverage import calculate_day_coverage
from app.utils.excel import create_schedule_excel_workbook
import urllib.parse

router = APIRouter(prefix="/schedules", tags=["Export"])

@router.get("/{id}/export-excel")
def export_schedule_excel(
    id: int,
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    period = db.query(SchedulePeriod).filter(SchedulePeriod.id == id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Schedule not found")

    days = period.days
    if start_date:
        days = [d for d in days if d.date >= start_date]
    if end_date:
        days = [d for d in days if d.date <= end_date]

    if not days and (start_date or end_date):
        # Fallback: check if another schedule period contains these dates
        alt_period = None
        if start_date:
            alt_period = db.query(SchedulePeriod).filter(
                SchedulePeriod.start_date <= start_date,
                SchedulePeriod.end_date >= start_date
            ).first()
        elif end_date:
            alt_period = db.query(SchedulePeriod).filter(
                SchedulePeriod.start_date <= end_date,
                SchedulePeriod.end_date >= end_date
            ).first()

        if alt_period:
            period = alt_period
            days = period.days
            if start_date:
                days = [d for d in days if d.date >= start_date]
            if end_date:
                days = [d for d in days if d.date <= end_date]

    if not days:
        raise HTTPException(status_code=400, detail="No schedule days found within the specified date range")

    sorted_days = sorted(days, key=lambda d: d.date)
    shifts_by_day = {}
    coverage_by_day = {}

    for d in sorted_days:
        shifts_by_day[d.id] = d.shifts
        coverage_by_day[d.date] = calculate_day_coverage(d.shifts)

    conflicts = [
        c for c in period.conflicts
        if not c.date or ((not start_date or c.date >= start_date) and (not end_date or c.date <= end_date))
    ]

    workbook_stream = create_schedule_excel_workbook(
        period=period,
        days=sorted_days,
        shifts_by_day=shifts_by_day,
        conflicts=conflicts,
        coverage_by_day=coverage_by_day
    )

    actual_start = sorted_days[0].date if sorted_days else period.start_date
    actual_end = sorted_days[-1].date if sorted_days else period.end_date

    filename = f"CallCenter_Schedule_{actual_start}_to_{actual_end}.xlsx"
    headers = {
        "Content-Disposition": f"attachment; filename=\"{filename}\"",
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }

    return StreamingResponse(workbook_stream, headers=headers)
