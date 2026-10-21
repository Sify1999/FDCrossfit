"""Competition athlete service — create & list athletes for the scoreboard."""

from sqlalchemy import case, delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.competition_athlete import CompetitionAthlete
from app.schemas.competition_athlete import CompetitionAthleteBulkCreate, CompetitionAthleteCreate


async def list_athletes(
    db: AsyncSession,
    level: str | None = None,
    event: int | None = None,
    name: str | None = None,
) -> list[CompetitionAthlete]:
    stmt = select(CompetitionAthlete)

    if level is not None:
        stmt = stmt.where(CompetitionAthlete.level == level)
    if event is not None:
        stmt = stmt.where(CompetitionAthlete.event == event)
    if name is not None:
        stmt = stmt.where(CompetitionAthlete.name.ilike(f"%{name}%"))

    # Ranking: highest score first. On a tie, time tiebreakers rank by the
    # LOWEST time (negate → DESC gives ascending time), everything else by the
    # highest value. NULLs always sink to the bottom.
    tiebreak_order = case(
        (CompetitionAthlete.tiebreaker_type == "time", -CompetitionAthlete.tiebreaker_value),
        else_=CompetitionAthlete.tiebreaker_value,
    )
    stmt = stmt.order_by(
        CompetitionAthlete.score.desc().nullslast(),
        tiebreak_order.desc().nullslast(),
        CompetitionAthlete.event,
        CompetitionAthlete.name,
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def list_distinct_names(
    db: AsyncSession,
    query: str | None = None,
) -> list[str]:
    """Return distinct athlete names, optionally filtered by search query."""
    from sqlalchemy import func

    stmt = select(CompetitionAthlete.name).distinct().order_by(CompetitionAthlete.name)
    if query:
        stmt = stmt.where(CompetitionAthlete.name.ilike(f"%{query}%"))
    result = await db.execute(stmt)
    return [row[0] for row in result.all()]


async def get_athlete_entries(
    db: AsyncSession,
    name: str,
) -> list[CompetitionAthlete]:
    """Get all competition entries for a specific athlete name."""
    stmt = (
        select(CompetitionAthlete)
        .where(CompetitionAthlete.name == name)
        .order_by(CompetitionAthlete.event)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_athlete(
    db: AsyncSession,
    data: CompetitionAthleteCreate,
) -> CompetitionAthlete:
    athlete = CompetitionAthlete(
        name=data.name,
        level=data.level,
        event=data.event,
        score=None,  # score starts empty — filled later per event
    )
    db.add(athlete)
    await db.flush()
    await db.refresh(athlete)
    return athlete


async def create_athlete_bulk(
    db: AsyncSession,
    data: CompetitionAthleteBulkCreate,
) -> list[CompetitionAthlete]:
    """Create an athlete registered for multiple events."""
    athletes = []
    for event in data.events:
        athlete = CompetitionAthlete(
            name=data.name,
            level=data.level,
            event=event,
            score=None,
        )
        db.add(athlete)
        athletes.append(athlete)
    await db.flush()
    for a in athletes:
        await db.refresh(a)
    return athletes


async def delete_athlete_entries(
    db: AsyncSession,
    name: str,
) -> int:
    """Delete all competition entries for a given athlete name. Returns count of deleted rows."""
    stmt = delete(CompetitionAthlete).where(CompetitionAthlete.name == name)
    result = await db.execute(stmt)
    await db.flush()
    return result.rowcount


async def update_athlete_score(
    db: AsyncSession,
    athlete_id: int,
    score: int | None,
    tiebreaker_type: str | None = None,
    tiebreaker_value: int | None = None,
) -> CompetitionAthlete | None:
    """Update the score and tiebreaker fields of a specific athlete entry."""
    values: dict = {"score": score}
    if tiebreaker_type is not None:
        values["tiebreaker_type"] = tiebreaker_type
    if tiebreaker_value is not None:
        values["tiebreaker_value"] = tiebreaker_value
    stmt = (
        update(CompetitionAthlete)
        .where(CompetitionAthlete.id == athlete_id)
        .values(**values)
    )
    await db.execute(stmt)
    await db.flush()

    # Fetch and return updated row
    result = await db.execute(
        select(CompetitionAthlete).where(CompetitionAthlete.id == athlete_id)
    )
    return result.scalar_one_or_none()