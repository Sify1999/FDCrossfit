"""Seed script — populates the movement library with common CrossFit movements.

Usage:
    python -m app.scripts.seed_movements

Safe to re-run; skips movements whose normalized_name already exists.
"""

import asyncio

from sqlalchemy import select

from app.db.session import async_session_factory
from app.models.movement import Movement
from app.services.movement import normalize_name

# (name, default_unit)
DEFAULT_MOVEMENTS: list[tuple[str, str]] = [
    # ── Weightlifting ─────────────────────────────────────────────────
    ("Back Squat", "reps"),
    ("Front Squat", "reps"),
    ("Overhead Squat", "reps"),
    ("Deadlift", "reps"),
    ("Romanian Deadlift", "reps"),
    ("Clean", "reps"),
    ("Power Clean", "reps"),
    ("Squat Clean", "reps"),
    ("Hang Clean", "reps"),
    ("Snatch", "reps"),
    ("Power Snatch", "reps"),
    ("Hang Snatch", "reps"),
    ("Clean & Jerk", "reps"),
    ("Push Press", "reps"),
    ("Push Jerk", "reps"),
    ("Split Jerk", "reps"),
    ("Strict Press", "reps"),
    ("Bench Press", "reps"),
    ("Thruster", "reps"),
    # ── Gymnastics ────────────────────────────────────────────────────
    ("Pull Up", "reps"),
    ("Chest To Bar", "reps"),
    ("Toes To Bar", "reps"),
    ("Muscle Up", "reps"),
    ("Ring Muscle Up", "reps"),
    ("Handstand Push Up", "reps"),
    ("Handstand Hold", "sec"),
    ("Push Up", "reps"),
    ("Ring Row", "reps"),
    ("Burpee", "reps"),
    ("Air Squat", "reps"),
    ("Lunge", "reps"),
    ("Sit Up", "reps"),
    ("Plank", "sec"),
    ("Hollow Hold", "sec"),
    # ── Monostructural ────────────────────────────────────────────────
    ("Run", "m"),
    ("Row", "cal"),
    ("Bike", "cal"),
    ("Ski Erg", "cal"),
    ("Assault Bike", "cal"),
    ("Double Unders", "reps"),
    ("Single Unders", "reps"),
    # ── Common CrossFit movements ──────────────────────────────────────
    ("Wall Ball", "reps"),
    ("Box Jump", "reps"),
    ("Box Step Up", "reps"),
    ("Kettlebell Swing", "reps"),
    ("Goblet Squat", "reps"),
    ("Dumbbell Thruster", "reps"),
    ("Dumbbell Snatch", "reps"),
    ("Turkish Get Up", "reps"),
    ("Barbell Row", "reps"),
    ("Dumbbell Bench Press", "reps"),
    ("Dumbbell Row", "reps"),
    ("Farmer's Carry", "m"),
    ("Pistol", "reps"),
    ("Ring Dip", "reps"),
    ("Parallel Bar Dip", "reps"),
    ("Rope Climb", "reps"),
    ("Bear Crawl", "m"),
]


async def seed_movements() -> None:
    async with async_session_factory() as session:
        existing = set()
        result = await session.execute(select(Movement.normalized_name))
        for row in result.scalars().all():
            existing.add(row)

        added = 0
        skipped = 0
        for name, default_unit in DEFAULT_MOVEMENTS:
            norm = normalize_name(name)
            if norm in existing:
                skipped += 1
                continue
            movement = Movement(
                name=name,
                normalized_name=norm,
                default_unit=default_unit,
            )
            session.add(movement)
            existing.add(norm)
            added += 1

        if added:
            await session.flush()
            await session.commit()
            print(f"✅ Added {added} movements.")
        else:
            await session.commit()
            print(f"✓ No new movements to add ({skipped} already exist).")


def main() -> None:
    asyncio.run(seed_movements())


if __name__ == "__main__":
    main()