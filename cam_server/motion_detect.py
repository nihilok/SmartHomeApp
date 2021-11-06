import datetime
import subprocess
import time
from threading import Thread

import cv2


class CVMotionDetect:

    def __init__(self, camera, debug=False):
        self.cap = cv2.VideoCapture(0)
        self.static_back = None
        self.running = True
        self.threads = []
        self.debug = debug
        self.recording = False
        self.camera = camera

    def waste_frames(self):
        i = 0
        while i < 24:
            ret, frame = self.cap.read()
            i += 1

    def check_loop(self):
        self.running = True
        self.waste_frames()
        try:
            while self.running:
                ret, frame = self.cap.read()
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                blur = cv2.GaussianBlur(gray, (21, 21), 0)
                if self.static_back is None:
                    self.static_back = blur
                    continue
                diff_frame = cv2.absdiff(self.static_back, blur)
                thresh_frame = cv2.threshold(diff_frame, 30, 255, cv2.THRESH_BINARY)[1]
                thresh_frame = cv2.dilate(thresh_frame, None, iterations=2)
                cnts, _ = cv2.findContours(thresh_frame.copy(),
                                           cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for contour in cnts:
                    if cv2.contourArea(contour) < 10000:
                        continue
                    if self.debug:
                        print('You moved!')
                        self.static_back = blur
                    else:
                        if not self.recording:
                            self.recording = True
                            self.static_back = None
                            self.camera.stop_recording()
                            video_name = datetime.datetime.now().strftime('%Y-%m-%d.%H:%M:%S')
                            subprocess.call(['raspivid', '-o', f'movement-{video_name}.h264', '-t', '10000'])
                            time.sleep(11)
                            self.recording = False
                            self.camera.start_recording()

        finally:
            self.cap.release()
            cv2.destroyAllWindows()

    def start(self):
        t = Thread(target=self.check_loop)
        t.setDaemon(True)
        t.start()
        self.threads.append(t)

    def stop(self):
        self.running = False
        for t in self.threads:
            try:
                t.join()
            except:
                pass


if __name__ == '__main__':
    md = CVMotionDetect(camera=None, debug=True)
    md.start()
    time.sleep(20)
