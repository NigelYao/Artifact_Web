"""Create decorative scene textures from the five user-provided reference stills.
The playable units and HUD values are removed; live DOM provides them in-game.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import cv2,numpy as np
root=Path(__file__).resolve().parents[1];out=root/'dist/assets/scene';out.mkdir(exist_ok=True)
ref=Image.open(next(root.glob('*192_164.jpg'))).convert('RGB')
wood=ref.crop((640,306,1070,447));wood.save(out/'wood.webp',quality=94)
M=cv2.getPerspectiveTransform(np.float32([[465,40],[2080,40],[2240,1060],[250,1060]]),np.float32([[0,0],[1599,0],[1599,899],[0,899]]))
focus=Image.fromarray(cv2.warpPerspective(np.array(ref),M,(1600,900)))
def overlay(base,tile,box,feather=12):
 layer=base.copy();layer.paste(tile.resize((box[2]-box[0],box[3]-box[1]),Image.Resampling.LANCZOS),box)
 mask=Image.new('L',base.size);ImageDraw.Draw(mask).rectangle(box,fill=255);mask=mask.filter(ImageFilter.GaussianBlur(feather))
 # Feather inward so source boundaries cannot form a rectangular seam.
 mask2=Image.new('L',base.size);ImageDraw.Draw(mask2).rectangle((box[0]+feather,box[1]+feather,box[2]-feather,box[3]-feather),fill=255)
 mask=mask2.filter(ImageFilter.GaussianBlur(feather/2))
 return Image.composite(layer,base,mask)
for box,poly in [((90,230,1440,466),[(181,230),(1346,230),(1410,461),(82,461)]),((85,499,1425,749),[(85,499),(1425,499),(1340,749),(185,749)])]:
 layer=focus.copy();layer.paste(wood.resize((box[2]-box[0],box[3]-box[1])),box)
 mask=Image.new('L',focus.size);ImageDraw.Draw(mask).polygon(poly,fill=255);mask=mask.filter(ImageFilter.GaussianBlur(5));focus=Image.composite(layer,focus,mask)
# Scenery repair is feathered; all video branding and controls are outside the final crop or covered.
forest=focus.crop((0,0,440,245)).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
focus=overlay(focus,forest,(1060,-35,1540,263),20)
focus=focus.crop((0,0,1510,855))
from PIL import ImageOps
focus=ImageOps.expand(focus,border=(0,0,0,12),fill=(45,34,27))
d=ImageDraw.Draw(focus)
for box in [(639,127,681,185),(783,132,838,190),(651,757,700,825),(812,764,863,829)]:d.rounded_rectangle(box,radius=5,fill=(36,37,33),outline=(74,71,60),width=2)
focus.save(out/'board-focus.webp',quality=95)
overview=Image.open(next(root.glob('*191_164.jpg'))).crop((865,280,1535,790)).convert('RGB')
for box,poly in [((25,139,637,256),[(67,139),(600,139),(637,255),(25,255)]),((24,276,641,390),[(24,276),(641,276),(599,390),(63,390)])]:
 layer=overview.copy();layer.paste(wood.resize((box[2]-box[0],box[3]-box[1])),box)
 mask=Image.new('L',overview.size);ImageDraw.Draw(mask).polygon(poly,fill=255);mask=mask.filter(ImageFilter.GaussianBlur(3));overview=Image.composite(layer,overview,mask)
d=ImageDraw.Draw(overview)
for box in [(287,86,310,120),(359,85,382,120),(288,404,312,440),(362,405,382,440)]:d.rounded_rectangle(box,radius=2,fill=(36,37,33))
overview.save(out/'board-overview.webp',quality=95)

# Character accents from the supplied deployment and versus references.
deployment=Image.open(next(root.glob('*193_164.jpg'))).convert('RGB')
deployment.crop((250,675,362,808)).save(out/'dire-creep.webp',quality=94)
intro=Image.open(next(root.glob('*190_164.jpg'))).convert('RGB')
imp=intro.crop((1775,211,2070,505))
mask=(np.array(imp).max(axis=2)>68).astype(np.uint8)*255
mask=cv2.morphologyEx(mask,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
count,labels,stats,_=cv2.connectedComponentsWithStats(mask)
largest=1+np.argmax(stats[1:,cv2.CC_STAT_AREA])
mask=(labels==largest).astype(np.uint8)*255
contours,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
cv2.drawContours(mask,contours,-1,255,cv2.FILLED)
imp=imp.convert('RGBA');imp.putalpha(Image.fromarray(cv2.GaussianBlur(mask,(3,3),.6)))
imp.save(out/'blue-imp.png')
