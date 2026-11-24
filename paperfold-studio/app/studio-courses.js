// Original teaching sequences. Coordinates are specified in the flattened
// state at the beginning of each fold; positive-z folds come toward the viewer.
const diamond=[[-1,0],[0,-1],[1,0],[0,1]];
const sheet=(w,h)=>[[-w,-h],[w,-h],[w,h],[-w,h]];
const L=[-1,0], R=[1,0], U=[0,1], D=[0,-1];
const frontHalf={axis:'v',sign:1}, rearHalf={axis:'v',sign:-1};
const back={reverse:true};

function move(point,target,zh,en,options={}){
  const dx=point[0]-target[0],dy=point[1]-target[1],length=Math.hypot(dx,dy);
  const nx=dx/length,ny=dy/length;
  return {point,nx,ny,offset:nx*(point[0]+target[0])/2+ny*(point[1]+target[1])/2,
    radians:(options.degrees??180)*Math.PI/180,direction:options.reverse?-1:1,
    layer:options.layer,zh,en};
}
const up=()=>move(D,U,
  ['对角合起','把下角折到上角，两尖对齐。','长边在下，两层尖角向上。'],
  ['Fold the diagonal','Lift the bottom corner to meet the top corner.','Both points face up and the long edge is at the bottom.']);
function model(names,group,details,color,folds,format=diamond){
  return {names,group,details,color,folds,sheet:format,
    cn:folds.map(fold=>fold.zh),en:folds.map(fold=>fold.en)};
}

const A4=Math.SQRT1_2;
const letter=sheet(A4,1);
const placard=sheet(1,.73);
export const studioCourses={
  rocket:model(['纸火箭','Paper rocket'],'play',['尖头与展开的尾翼','A pointed nose and raised fins'],0xda805e,[
    move([-.86,1],[-.40,1],['收窄机身左侧','沿纵向折入左边的一条长边。','折边从顶端一直通到底端。'],['Narrow the left body','Fold a long strip in along the left side.','The crease runs from top to bottom.']),
    move([.86,1],[.40,1],['收窄机身右侧','用相同宽度折起右边。','机身左右对称。'],['Narrow the right body','Fold the same width along the right.','The body is symmetrical.']),
    move([-.63,1],[0,.50],['折左半个头锥','把左上角向中线折，顶边开始变尖。','尖锥仍与机身中线相接。'],['Make the left nose cone','Bring the left upper point inward along a diagonal.','The nose cone stays centered on the body.']),
    move([.63,1],[0,.50],['折右半个头锥','把右上角也向中线折。','两条斜边在上方交成箭头。'],['Make the right nose cone','Mirror the diagonal on the right.','Two slanted edges meet at the nose.']),
    move([.63,-1],[.20,-.62],['抬起右尾翼','沿右下方斜线抬起小三角，留一点角度。','尾翼和机身之间能看出折角。'],['Raise the right fin','Lift the lower-right triangle along the diagonal and leave it slightly open.','You can see a corner between the body and the fin.'],{degrees:50}),
    move([-.63,-1],[-.20,-.62],['抬起左尾翼','对称抬起左下角，保持同样角度。','两侧都有翘起的尾翼，可画上舷窗。'],['Raise the left fin','Lift the other lower triangle to match.','Two fins lift from the body. Draw a porthole if you like.'],{degrees:50})
  ],sheet(.86,1)),
  bridge:model(['纸桥挑战','Paper bridge'],'play',['矩形纸 · 把平纸折成槽形','Rectangle · Build a channel-shaped bridge'],0x6caaad,[
    move([-1,.73],[-1,.49],['加厚桥身一边','沿长边折入一条窄边。','两层贴紧，折线平行。'],['Reinforce one long edge','Fold in a narrow strip along the long edge.','Press the two layers together.']),
    move([-1,-.73],[-1,-.49],['加厚另一边','在另一条长边折出相同的窄边。','两边折线间距一致。'],['Reinforce the other edge','Fold the same narrow strip along the other side.','The two creases are evenly spaced.']),
    move([1,.61],[1,.17],['立起第一道桥边','与原折边平行，把这一侧折到接近直角。','从侧面看纸面呈 L 形。'],['Raise the first rail','Lift one side along a parallel crease until it is nearly upright.','From the side, the sheet looks like an L.'],{degrees:88}),
    move([1,-.61],[1,-.17],['立起第二道桥边','把另一侧也折到接近直角。','纸面变成槽形。架在两本书上，和没折过的纸比一比，看看哪种更稳。'],['Raise the second rail','Lift the other side to match.','Span two books with the folded channel and compare how it behaves next to an unfolded sheet.'],{degrees:88})
  ],placard),
  rabbit:model(['长耳兔','Long-eared rabbit'],'animals',['叠层折出两只长耳','A folded band and two long ears'],0xb398cd,[
    up(),
    move(L,[-1,.30],['折一条底边','把三角形的长边一起抬起，折成窄条。','新底边仍和原底边平行。'],['Fold up a narrow band','Lift the long bottom edge across its full width.','The new edge runs parallel to the old one.']),
    move([-.85,.15],[-.30,1.12],['抬起左边长耳','把左边最长的尖端斜向上折。','左耳超过头顶，略向外撇。'],['Raise the left ear','Lift the longest left point up toward the top.','The ear reaches above the head and leans outward slightly.']),
    move([.85,.15],[.30,1.12],['抬起右边长耳','把另一端朝上折，和左耳对称。','两耳中间还留着一点空隙，可以画兔脸。'],['Raise the right ear','Lift the other point to mirror the first ear.','Leave a gap between the ears and draw a face if you like.'])
  ]),
  whale:model(['小鲸鱼','Little whale'],'animals',['风筝形船身与翘尾','Kite folds and an upturned tail'],0x65a9c9,[
    move(U,[Math.SQRT2-1,0],['折上侧长边','把上角折到水平中线稍靠右的位置。','左尖角留在原地。'],['Fold the upper edge in','Bring the top point to the center line, a little right of center.','The far-left point stays in place.']),
    move(D,[Math.SQRT2-1,0],['折下侧长边','把下角折到同一个位置。','上下两边在中线会合，成为风筝形。'],['Fold the lower edge in','Bring the lower point to the same spot.','The two folds meet on the center line.']),
    move(R,[.48,0],['折平鲸头','把右尖角向左折一小段。','右端变成平的，左端还很尖。'],['Blunt the head','Fold the right point left a short way.','The right end is blunt while the left stays pointed.']),
    move([.02,-.52],[.02,.52],['沿身体合起','把身体下半边沿中线向上合。','厚的一端是头，长尖端是尾。'],['Fold the body in half','Lift the lower half along the horizontal center line.','The blunter end is the head and the long point is the tail.']),
    move(L,[-.62,.44],['翘起鲸尾','把左端向斜上方提起。','尾巴超过背线，鲸头可以点一只眼睛。'],['Raise the tail','Fold the left end diagonally upward.','The tail rises above the back. Add an eye near the head.'])
  ]),
  penguin:model(['小企鹅','Penguin'],'animals',['双侧翅与斜尖嘴','Side wings and an angled beak'],0x4e7092,[
    move(L,[-.27,-.24],['折入左翼','把左尖角斜向右下折。','左侧出现第一条斜边。'],['Fold in the left wing','Bring the left point diagonally down and inward.','The left side now has a slanted edge.']),
    move(R,[.27,-.24],['折入右翼','把右尖角折到相对的位置。','两翼留在身体前方。'],['Fold in the right wing','Mirror the fold with the right point.','Both wings sit on the front of the body.']),
    move(D,[0,-.50],['折平脚底','把下尖角向上折一小段。','企鹅能画在一条水平脚线上。'],['Make the flat base','Fold the bottom point up a short way.','The figure now has a horizontal base.']),
    move(U,[.27,.42],['折下斜嘴','把顶角向右下折一点，留出尖端。','尖嘴和两侧的翼都能分辨。'],['Fold the beak','Bring the top point down and a little to the right.','You can see the beak and both side wings.'])
  ]),
  pinwheel:model(['风车纸花','Pinwheel rosette'],'nature',['四块斜瓣绕中心转向','Four angled petals curl around a center'],0xae90cd,[
    move([-.72,.72],[-.12,.18],['抬起左上瓣','把左上角斜折向中心偏左的位置，保留一点角度。','花瓣在上沿翘起，可以看见反面的颜色。'],['Lift the upper-left petal','Fold the upper-left point toward the left of center and leave it slightly raised.','The reverse color shows on the lifted petal.'],{degrees:138}),
    move([.72,.72],[.18,.12],['抬起右上瓣','把右上角折向偏右的位置，使折线顺时针排开。','第二片花瓣朝向下一角。'],['Lift the upper-right petal','Fold the upper-right point inward and slightly right so the creases turn clockwise.','This petal points toward the next corner.'],{degrees:138}),
    move([.72,-.72],[.12,-.18],['抬起右下瓣','照同样方向抬起右下角。','三片花瓣的折角接近。'],['Lift the lower-right petal','Lift the lower-right point in the same turning pattern.','The three petals lift at similar angles.'],{degrees:138}),
    move([-.72,-.72],[-.18,-.12],['抬起左下瓣','折起最后一个角，四瓣围住中心。','从斜上方看四片立起来的花瓣。可贴到卡片上。'],['Lift the lower-left petal','Fold the final corner in to complete the ring.','Look for four tilted petals. It works well on the front of a card.'],{degrees:138})
  ],sheet(.72,.72)),
  tulip:model(['郁金香花朵','Tulip bloom'],'nature',['两瓣向上叠出的花苞','Two upward folds make a bloom'],0xe891a1,[
    up(),
    move(L,[-.49,.79],['折起左花瓣','把左尖角斜向上折，留出中间花瓣。','左花瓣尖在中心尖的左侧。'],['Lift the left petal','Bring the left point diagonally up, leaving the middle point visible.','The left petal sits to the left of the middle point.']),
    move(R,[.49,.79],['折起右花瓣','把右尖角朝相反方向向上折。','能数出三个花尖。'],['Lift the right petal','Raise the right point to mirror the left side.','Count three distinct petal tips.']),
    move([0,0],[0,.26],['收平花底','沿底部折一条窄边到背面。','花底平整，贴在贺卡上能留出画花茎的位置。'],['Flatten the base','Turn a short band at the bottom behind the bloom.','The flat edge makes it easy to place on a card and draw a stem below.'],back)
  ]),
  leaf:model(['立体树叶','Creased leaf'],'nature',['风筝形叶片与隆起叶脉','A kite-shaped leaf with a raised vein'],0x7aab78,[
    move(L,[0,-.27],['合拢左叶边','把左尖角折向靠下的中线。','叶片左边收窄。'],['Narrow the left side','Bring the left point to the center, a little below the midpoint.','The left edge of the leaf becomes narrower.']),
    move(R,[0,-.27],['合拢右叶边','把另一侧折到同一点。','两条斜边汇向细尖。'],['Narrow the right side','Bring the right point to the same spot.','The angled sides lead to a narrow point.']),
    move(D,[0,-.63],['收住叶柄端','把短的下尖角向背面折。','上下两端长度不同，窄折边是叶柄端。'],['Trim the stem end','Fold the short lower point behind.','The narrower folded end can sit against a drawn stem.'],back),
    move([.38,.25],[-.38,.25],['折出主叶脉','从正中稍抬起右半片。','侧视时中线隆起，叶片不会完全闭合。'],['Raise the center vein','Lift the right half along the middle by a small angle.','From the side, the ridge stays visible and the leaf stays open.'],{degrees:43})
  ]),
  sailboat:model(['单帆小船','Single-sail boat'],'play',['用短折边做出长船身','A narrow band becomes the hull'],0x6a9fca,[
    up(),
    move(L,[-1,.34],['折出船身','把三角形的长边向上折一窄条，两层一起动。','船身两端比帆伸得更宽。'],['Fold up the hull','Lift a narrow band along the long bottom edge, moving both layers.','The hull extends a little past both sides of the sail.']),
    move([-1,.34],[-.83,.28],['折出斜船头','把船身左端的小尖角折到背面。','三角帆在上，窄船身在下。把小船贴到画里的水线上。'],['Shape the bow','Fold the little left point of the hull behind.','A triangular sail sits above the narrow hull. Place it on a drawn waterline.'],back)
  ]),
  dart:model(['飞镖纸飞机','Paper dart'],'play',['A4 纸 · 收窄机鼻','A4 paper · Narrow the nose'],0x648ec6,[
    move([-A4,1],[0,1-A4],['折左上角','让左上角落在纵向中线上，上方留出机鼻。','左上斜边贴到中线。'],['Fold the top-left corner','Bring the upper-left corner to the lengthwise center line.','The folded edge follows the center line.']),
    move([A4,1],[0,1-A4],['折右上角','把右上角折到同一点。','两个斜边对称，最上方留下尖机鼻。'],['Fold the top-right corner','Bring the top-right corner to the same spot.','Look for a symmetrical pointed nose.']),
    move([-A4,1-A4],[0,0],['收窄左肩','把左肩折向中线，形成更窄的机鼻。','新左斜边贴近中线。'],['Narrow the left shoulder','Fold the left shoulder to the center line.','The new slanted edge runs close to the center.']),
    move([A4,1-A4],[0,0],['收窄右肩','将右肩同样折入。','两边对称，鼻尖没有偏向一侧。'],['Narrow the right shoulder','Bring the right shoulder in to match.','The two shoulders meet symmetrically.']),
    move([A4,-1],[-A4,-1],['抬起机身中脊','沿纵向中线折成浅 V，把两翼保持张开。','正面看两翼等高。在开阔处平推试飞。'],['Raise the center ridge','Fold the dart into a shallow V while leaving both wings open.','Check that the wings sit evenly before a gentle test flight.'],{degrees:55})
  ],letter),
  hat:model(['报纸帽','Newspaper hat'],'play',['A4 纸或报纸 · 双面帽檐','A4 or newspaper · A two-sided brim'],0xbe9b66,[
    move([-A4,1],[-A4,-1],['把纸上下对折','把上短边向下与下短边对齐，折痕留在上方。','纸张呈横矩形，下面是开口。'],['Fold the sheet down','Bring the top short edge to the bottom edge.','The crease is at the top with two loose edges at the bottom.']),
    move([-A4,0],[0,-A4],['折帽顶左边','把左上角斜折到正中。','左上方是斜边，底下留一条纸带。'],['Fold the left top corner','Bring the upper-left corner diagonally to the middle.','There is a strip of paper below the triangle.']),
    move([A4,0],[0,-A4],['折帽顶右边','把右上角折到相同位置。','成品轮廓上半部是一个三角形。'],['Fold the right top corner','Bring the other upper corner to the same point.','The upper silhouette is triangular.']),
    move([A4,-1],[A4,1-2*A4],['翻起前帽檐','沿三角形底边，只把靠你的一层纸带向上折。','另一条纸带仍朝下。'],['Fold up the front brim','Lift only the near strip along the bottom of the triangle.','The rear strip still hangs down.'],{layer:frontHalf}),
    move([-A4,-1],[-A4,1-2*A4],['翻起后帽檐','转到背面，把剩下的纸带向后折上。','两侧帽檐等高，从底部撑开。'],['Fold up the rear brim','Look from the back and turn the remaining strip up.','Both brims line up. Open the hat from the bottom.'],{layer:rearHalf,reverse:true})
  ],letter),
  heart:model(['纸爱心','Paper heart'],'nature',['两段对折形成心形','A heart made from paired folds'],0xd78188,[
    move(U,[0,0],['折下顶角','把上角折到纸的中心。','上边出现一条水平折痕。'],['Fold down the top point','Bring the top point to the middle of the sheet.','The top now has a horizontal edge.']),
    move(D,[0,.50],['把下角送到上边','让下角对齐刚折出的水平边中点。','上下两折在中线上对齐。'],['Bring the bottom point up','Match the lower point to the middle of the new top edge.','Both folds line up along the center.']),
    move(L,[-.25,.75],['抬起左边','把左边向斜上方折，让下斜边靠近中线。','左半边凸起，底部留下一个下尖。'],['Fold the left side upward','Bring the left side diagonally up toward the center.','The left lobe rises and the lower point stays visible.']),
    move(R,[.25,.75],['抬起右边','把右边向上折到对称位置。','左右是两瓣，中间有浅凹口。'],['Fold the right side upward','Mirror the fold on the other side.','Two lobes sit above the lower point.']),
    move([-.25,.75],[-.25,.59],['柔化两瓣','同时把两瓣最高的小尖端沿水平线折向背面。','底端保持尖，两瓣上沿变平。可以把爱心夹在卡片里。'],['Soften both lobes','Fold the two little upper points behind along one horizontal line.','Keep the bottom pointed and flatten the two lobes. Slip the heart into a card.'],back)
  ]),
  envelope:model(['四角信封','Square envelope'],'objects',['不用胶，夹一张小便笺','Tuck a short note inside'],0x86ae98,[
    move(L,[.02,0],['折左翼','把左尖角送到纸张正中。','左翼向中心闭合。'],['Fold in the left flap','Bring the left point to the middle.','The left flap closes over the center.']),
    move(R,[-.02,0],['折右翼','同样折入右边，两尖轻微重合。','两侧折线平行。'],['Fold in the right flap','Bring the right point inward, overlapping slightly.','The two side creases are parallel.']),
    move(D,[0,.28],['抬起信封底','把下角向上折，盖住左右两翼的下半部。','便笺可压在底折和背纸之间。'],['Raise the bottom flap','Bring the bottom point up over the lower part of both side flaps.','A small note can sit between the bottom flap and the back.']),
    move(U,[0,-.36],['合上封口','把上角向下折，盖在信封底折上。','封口可以重新掀开，可贴一枚纸爱心。'],['Close the flap','Fold the top down over the bottom flap.','The flap lifts again when you want to open the note.'])
  ]),
  frame:model(['迷你纸相框','Mini paper frame'],'objects',['矩形纸 · 四边形成对比边框','Rectangle · Four clean borders'],0x8e8dc3,[
    move([-1,.73],[-1,.41],['压出上框','把上长边向下折一条窄边。','框线与纸边平行。'],['Fold the top border','Turn down a narrow strip along the top.','Keep the crease parallel to the long edge.']),
    move([-1,-.73],[-1,-.41],['压出下框','把下长边反向折起同样宽的纸带。','上下框宽度接近。'],['Fold the bottom border','Fold up an equally narrow strip at the bottom.','The two borders match in width.']),
    move([-1,.57],[-.68,.57],['压出左框','把左侧窄边沿竖线向内折，连同角上的两层。','左边角压平，留出中央位置。'],['Fold the left border','Fold the left strip inward through the overlapping corners.','Flatten the corners and leave the center visible.']),
    move([1,.57],[.68,.57],['压出右框','把右侧按同样宽度向内折。','四条边会围出一块平整的中心，可以插入小画。'],['Fold the right border','Repeat with the same width on the right.','Four straight borders surround a flat space for a tiny drawing.'])
  ],placard),
  house:model(['屋顶小屋','Rooftop house'],'objects',['方纸折成墙身和双斜屋顶','A square becomes walls and a sloping roof'],0xc49575,[
    move([-.78,.78],[0,.78],['折左墙边','把左竖边折到中央竖线上。','左边窄一半，内部有重叠纸面。'],['Fold in the left wall','Bring the left edge to the vertical center.','One wall now overlaps the middle of the sheet.']),
    move([.78,.78],[0,.78],['折右墙边','把右竖边折入，同样对齐中线。','正面出现两扇并排的纸面。'],['Fold in the right wall','Bring the right edge to the same center line.','Two flat flaps meet in the middle.']),
    move([-.39,.78],[0,.39],['压出左屋檐','把左上角向内向下折到背面。','左边出现一条向上的斜屋檐。'],['Fold the left roofline','Turn the top-left corner behind along the diagonal.','A sloping roofline remains on the left.'],back),
    move([.39,.78],[0,.39],['压出右屋檐','右上角向背面对称折。','两坡在屋顶相遇，墙上可以画窗和门。'],['Fold the right roofline','Turn the other top corner behind to match.','The roof slopes meet above a place for windows and a door.'],back)
  ],sheet(.78,.78)),
  shield:model(['纸徽章','Paper shield'],'play',['画一个自己的盾徽','Fold a shield and draw your own crest'],0xbda665,[
    move(U,[0,.28],['折平盾顶','把上角向下折一小段，留下宽顶边。','顶部已经是一条平线。'],['Make the flat top','Fold the upper point down a short way.','The shield now has a flat upper edge.']),
    move(L,[-.58,0],['收左侧轮廓','左端向背面折，压出短竖边。','顶边与左侧连接成角。'],['Shape the left side','Fold the left point behind, leaving a short vertical edge.','The side meets the top at a clear corner.'],back),
    move(R,[.58,0],['收右侧轮廓','向背面对称折住右端。','两条侧边平行。'],['Shape the right side','Repeat the back fold on the right.','The new side edges are parallel.'],back),
    move(D,[0,-.79],['收住盾尖','把下尖端向后折一点。','成品上宽下窄，可以在中心画徽章。'],['Finish the lower tip','Tuck a very small part of the bottom point behind.','Draw a crest on the wide center of the shield.'],back)
  ]),
  tent:model(['桌面名牌','Desk name tent'],'objects',['矩形纸 · 可以立在桌上','Rectangle · Stands on a desk'],0x72a89f,[
    move([-1,.73],[-1,.45],['加强上脚边','把上边向内折一个窄边。','折线和长边平行。'],['Reinforce the top foot','Fold a narrow strip in along the top edge.','The crease is parallel to the long side.']),
    move([-1,-.73],[-1,-.45],['加强下脚边','从另一条长边折出同宽窄边。','两条压边可以撑在桌面上。'],['Reinforce the bottom foot','Fold the same width in along the other long side.','Both folded edges can rest on the desk.']),
    move([1,.59],[1,-.59],['折起中间桌脊','沿横向中线抬起一半，到两面张开的角度停住。','把两脚边放到桌面，写上名字即可。'],['Raise the center ridge','Lift one half along the middle until the two sides form a tent.','Stand it on the two long feet and write your name on one side.'],{degrees:106})
  ],placard)
};
