'''
Created on 2013-6-5

@author: lihan01
'''
def func():
    count=0
    for x in range(101):
        for y in range(101):
            for z in range(101):
                if x+y+z == 100:
                    count = count + 1
                    
    print count

if __name__ == '__main__':
    func()