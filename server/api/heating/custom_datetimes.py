from typing import Optional

import pytz
from datetime import datetime


class BritishTime(datetime):
    timezone = pytz.timezone('Europe/London')

    @classmethod
    def dst(cls, dt: Optional[datetime] = None):
        dt = dt if dt is not None else cls.utcnow()
        return cls.timezone.dst(dt)

    @classmethod
    def now(cls, tz=None):
        time = super().utcnow()
        return time + cls.dst(time)

    @classmethod
    def fromtimestamp(cls, t, tz=None):
        time = super().fromtimestamp(t, tz)
        return time + cls.dst(time)


if __name__ == '__main__':
    bst = BritishTime.now()
    print(bst)
