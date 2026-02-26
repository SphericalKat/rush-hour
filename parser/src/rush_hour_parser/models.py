from dataclasses import dataclass, field


@dataclass
class Stop:
    station: str
    # Minutes from midnight. May exceed 1440 for post-midnight arrivals
    # e.g. 1465 = 00:25 next day (24*60 + 25)
    departure: int


@dataclass
class Train:
    number: str   # e.g. "96301"
    code: str     # Raw type/destination code from timetable, e.g. "A 1"
    is_ac: bool
    stops: list[Stop] = field(default_factory=list)


@dataclass
class Timetable:
    route: str       # e.g. "CSMT-KALYAN-KHOPOLI-KASARA"
    direction: str   # "up" or "down"
    trains: list[Train] = field(default_factory=list)
