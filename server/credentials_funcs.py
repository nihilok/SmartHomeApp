import base64
import getpass

hash = '<MD5sum hash of your main app password>'
test_code = 'bWRHVnpkQT09aj0='


class Creds:
	gmail = '<YOURGMAIL@gmail.com>'
	pwd = None


def decode_pw(coded_pw):
	return base64.b64decode(base64.b64decode(coded_pw.encode('utf-8')).decode('utf-8')[1:-2].encode('utf-8')).decode('utf-8')


def encode_pw(pw):
	return base64.b64encode(('m' + base64.b64encode(pw.encode('utf-8')).decode('utf-8') + 'j=').encode('utf-8')).decode('utf-8')


if __name__ == '__main__':
	print(test_code)
	print(encode_pw('test'))
	print(encode_pw(decode_pw(test_code)) == test_code)
	with open('pw.txt', 'w') as f:
		f.write(encode_pw(getpass.getpass('password: ')))
	# with open('pw.txt', 'r') as f:
	# 	 pwd = f.read().strip()
	# 	 print(decode_pw(pwd))
