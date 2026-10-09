from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import ScheduleDay, ShiftAssignment, SchedulePeriod
from app.schemas import DayCoverageSummary
from app.engine.coverage import calculate_day_coverage, calculate_matrix_summary

router = APIRouter(prefix="/coverage", tags=["Coverage"])

@router.get("/day/{date_str}", response_model=DayCoverageSummary)
def get_day_coverage(
    date_str: str,
    schedule_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    base_query = (
        db.query(ScheduleDay)
        .join(SchedulePeriod, ScheduleDay.schedule_period_id == SchedulePeriod.id)
        .filter(ScheduleDay.date == date_str)
    )
    if schedule_id:
        day = base_query.filter(ScheduleDay.schedule_period_id == schedule_id).first()
    else:
        day = (
            base_query.filter(SchedulePeriod.status == "published")
            .order_by(SchedulePeriod.id.desc())
            .first()
        )
        if not day:
            day = base_query.order_by(SchedulePeriod.id.desc()).first()

    if not day:
        raise HTTPException(status_code=404, detail="No schedule found for the specified date")

    coverage = calculate_day_coverage(day.shifts)
    d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()

    return {
        "date": day.date,
        "day_of_week": day.day_of_week,
        "is_sunday": (d_obj.weekday() == 6),
        "is_saturday": (d_obj.weekday() == 5),
        "time_slots": coverage["time_slots"],
        "channels": coverage["channels"]
    }

@router.get("/matrix/{schedule_id}")
def get_schedule_coverage_matrix(schedule_id: int, db: Session = Depends(get_db)):
    period = db.query(SchedulePeriod).filter(SchedulePeriod.id == schedule_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Schedule not found")

    rows = []
    for day in sorted(period.days, key=lambda d: d.date):
        d_obj = datetime.strptime(day.date, "%Y-%m-%d").date()
        cov = calculate_day_coverage(day.shifts)
        rows.append({
            "date": day.date,
            "day_of_week": day.day_of_week,
            "day_name": d_obj.strftime("%A"),
            "is_weekend": day.is_weekend,
            "time_slots": cov["time_slots"],
            "channels": cov["channels"],
            "day_stats": cov["day_stats"],
        })

    summary = calculate_matrix_summary(rows)

    return {
        "schedule_id": schedule_id,
        "schedule_name": period.name,
        "start_date": period.start_date,
        "end_date": period.end_date,
        "status": period.status,
        "summary": summary,
        "days": rows,
    }
