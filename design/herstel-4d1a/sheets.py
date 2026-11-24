from PIL import Image, ImageDraw
OUT='/home/claude/herstel4d1a/bladen/'
def tile(paths, labels, crop=None, scale=1.0, title=''):
    ims=[]
    for p in paths:
        im=Image.open(p).convert('RGB')
        if crop: im=im.crop(crop(im))
        if scale!=1: im=im.resize((int(im.width*scale),int(im.height*scale)),Image.LANCZOS)
        ims.append(im)
    w=sum(i.width for i in ims)+12*(len(ims)-1); h=max(i.height for i in ims)+24
    S=Image.new('RGB',(w,h),(70,70,70)); d=ImageDraw.Draw(S); x=0
    for i,(im,l) in enumerate(zip(ims,labels)):
        d.text((x+4,4),(title+'  ' if i==0 else '')+l,fill=(255,255,0) if i==0 else (0,255,255) if i==len(ims)-1 else (255,170,120)); S.paste(im,(x,22)); x+=im.width+12
    return S
def stack(rows, name):
    W=max(r.width for r in rows); H=sum(r.height+10 for r in rows)
    S=Image.new('RGB',(W,H),(40,40,40)); y=0
    for r in rows: S.paste(r,(0,y)); y+=r.height+10
    S.save(OUT+name); print(name,S.size)
F,O,N='/tmp/cmp-faf/ref/','/tmp/cmp-177/ref/','/tmp/cmp-177/nu/'
L3=['faf50f0','177e881 (4D-1a)','herstel']
top=lambda f:(lambda im:(0,0,im.width,int(im.height*f)))
for sc in ['x01-4sp','x01-teams']:
    rows=[tile([F+sc+'/'+v,O+sc+'/'+v,N+sc+'/'+v],L3,crop=top(.62),title=sc+' '+v.replace('.png','')) for v in ['android-360-nl-dark.png','se-en-light.png','se-nl-dark.png','mobiel-en-dark.png','groot-nl-light.png']]
    stack(rows,f'1-{sc}-telefoon.png')
rows=[tile([F+'x01-4sp/tablet-staand-nl-dark.png',O+'x01-4sp/tablet-staand-nl-dark.png',N+'x01-4sp/tablet-staand-nl-dark.png'],L3,crop=top(.33),scale=.7,title='x01-4sp tablet-staand'),
      tile([F+'x01-teams/tablet-staand-nl-light.png',O+'x01-teams/tablet-staand-nl-light.png',N+'x01-teams/tablet-staand-nl-light.png'],L3,crop=top(.33),scale=.7,title='x01-teams tablet-staand licht'),
      tile([F+'x01-4sp/kantine-1280-en-light.png',O+'x01-4sp/kantine-1280-en-light.png',N+'x01-4sp/kantine-1280-en-light.png'],L3,crop=lambda im:(0,250,700,560),scale=.75,title='x01-4sp kantine-1280 EN licht'),
      tile([F+'x01-4sp/kantine-1920-nl-dark.png',O+'x01-4sp/kantine-1920-nl-dark.png',N+'x01-4sp/kantine-1920-nl-dark.png'],L3,crop=lambda im:(0,400,1090,720),scale=.55,title='x01-4sp kantine-1920')]
stack(rows,'2-tablet-kantine.png')
z=lambda box:(lambda im:box)
rows=[tile([F+'x01-2sp/mobiel-nl-light.png',O+'x01-2sp/mobiel-nl-light.png',N+'x01-2sp/mobiel-nl-light.png'],L3,crop=z((200,150,380,240)),scale=3,title='x01-2sp 390 licht: "legs" actieve kaart'),
      tile([F+'x01-2sp/kantine-1920-nl-light.png',O+'x01-2sp/kantine-1920-nl-light.png',N+'x01-2sp/kantine-1920-nl-light.png'],L3,crop=z((1080,400,1340,460)),scale=2.2,title='x01-2sp 1920 licht')]
stack(rows,'3-contrast-legs.png')
E,H='/tmp/h1/edge-o/','/tmp/h1/edge-h/'
L2=['177e881 (4D-1a)','herstel']
rows=[tile([E+f,H+f],L2,crop=top(.5) if not f.startswith(('x','y')) else None,title=f.replace('.png','')) for f in ['avg-imp-360-nl.png','avg-imp-390-en.png','avg100-390-nl.png','lang-375-nl.png','sets-390-nl.png']]
stack(rows,'4-randgevallen-telefoon.png')
rows=[tile(['/tmp/h1/st-o/'+f,'/tmp/h1/st-h/'+f],L2,crop=top(.62),title=f.replace('.png','')) for f in ['6sp-start-390-nl.png','6sp-route-390-en.png','4sp-imp-375-nl.png','3sp-start-360-en.png']]
stack(rows,'5-6spelers-en-toetsen.png')
rows=[tile([E+f,H+f],L2,crop=lambda im:(0,int(im.height*.3),int(im.width*.55),int(im.height*.8)),scale=.7 if '1920' in f else 1,title=f.replace('.png','')) for f in ['avg100-1920-nl.png','avg-imp-1920-en.png','sets-1024-en.png']]+[tile([E+'avg-imp-768-nl.png',H+'avg-imp-768-nl.png'],L2,crop=lambda im:(0,0,im.width,int(im.height*.3)),title='avg-imp-768-nl')]
stack(rows,'6-kantine-tablet-randgevallen.png')
