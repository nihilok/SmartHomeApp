import logging


def get_logger():
    logger = logging.getLogger('Heating System')
    logger.setLevel(logging.DEBUG)

    fh = logging.FileHandler(filename='heating.log')
    fh.setLevel(logging.DEBUG)

    ch = logging.StreamHandler()
    ch.setLevel(logging.WARNING)

    formatter = logging.Formatter('[%(levelname)s] [%(asctime)s] %(message)s (%(name)s)')

    ch.setFormatter(formatter)
    fh.setFormatter(formatter)

    logger.addHandler(ch)
    logger.addHandler(fh)
    return logger
