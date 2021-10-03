from typing import Optional

import pytz
from datetime import datetime


class BritishTime(datetime):
    timezone = pytz.timezone('Europe/London')

    @classmethod
    def dst(cls, dt: Optional[datetime] = None):
        dt = dt if dt is not None else cls.now()
        return cls.timezone.dst(dt)


if __name__ == '__main__':
    bst = BritishTime.now()
    print(bst.dst())
