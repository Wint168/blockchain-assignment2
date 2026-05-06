import hashlib

m = '1JodieTucker37'
# identity stored in PKG once sent by the inventory 
i1 = 231265
i2 = 5342532
i3 = 4526377

# Prime Number stored within the PKG only
p = 307699126915021078949717556805305347641 
q = 286189067004968539490940912607240844261

# Key generation by PKG. store the value in PKG file only
# Public Key > (n,e) >
# 

n= p*q
print(f'n: {n}')

phi_n = (p-1) * (q-1)
print(f'phi_n:{phi_n}')


e= 71
print(f'e: {e}')

d = pow(e, -1, phi_n)
print (f'd: {d}')

g1 = pow(i1, d, n)
print(f'g1: {g1}')

g2= pow(i2,d, n)
print(f'g2:{g2}')

g3 = pow(i3,d, n)
print(f'g3 :{g3}')

r1 = 124524
r2 = 117623
r3 = 156253

# generate partial t -> 

t1 = pow(r1,e, n)
print(f't1: {t1}')

t2= pow(r2,e,n)
print(f't2: {t2}')

t3 = pow(r3,e, n)
print(f't3: {t3}')

t = (t1 * t2 * t3) % n
print(f't: {t}')


#CONVERTING THE MESSAGE 
# PREPROCESS THE M -> THIS IS DONE BY EACH OF THE INVENTORY
c_m = str(t) + m 
print(f'cm: {c_m}')

# HASH THE VALUE 

h_cm = hashlib.md5(c_m.encode()).hexdigest()
print(f'hcm: {h_cm}')

#convert it to decimal 
int_hcm = int(h_cm, 16)
print (f'int_hcm: {int_hcm}')

# each signer signs the message 

sj = gj * rj ^ H(t,m) mod n

s1_1 = g1 % n
s1_2 = pow(r1, int_hcm, n)
s1 = (s1_1 * s1_2) % n
print(f's1: {s1}')

s2_1 = g2 % n
s2_2 = pow(r2, int_hcm, n)
s2 = (s2_1 * s2_2) % n
print(f's2: {s2}')

s3_1 = g3 % n
s3_2 = pow(r3, int_hcm, n)
s3 = (s3_1 * s3_2) % n
print(f's3: {s3}')

s = (s1*s2*s3) % n

#verification 
#s^e mod n =  pi ij * t^(H(t,m)) mod n

v1 = pow (s,e,n)

v2_1 = (i1*i2*i3) % n 
v2_2 = pow(t, int_hcm, n)
v2 = (v2_1 * v2_2) % n

if v1 == v2: 
    print("data has been verified")
    
