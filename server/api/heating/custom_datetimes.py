import pytz
from datetime import datetime


class BritishTime(datetime):
    timezone = pytz.timezone('Europe/London')

    @classmethod
    def dst(cls):
        return cls.timezone.dst(cls.now())


if __name__ == '__main__':
    bst = BritishTime.now()
    print(bst.dst())
    print(bool(bst.past()))
