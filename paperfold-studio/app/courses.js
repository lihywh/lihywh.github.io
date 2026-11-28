import {studioCourses} from './studio-courses.js';

export const courseText = {
  dog: {
    group:'animals',
    names:['小狗脸','Dog face'],
    details:['一张方纸 · 基础折法','One square · First folds'],
    cn:[
      ['沿对角线折','把上面的尖角向下折，与下方尖角对齐。','长边在上，两个纸尖在下。'],
      ['折左耳','握住左尖角，斜向内折，两层一起动。','左耳的尖端朝下。'],
      ['折右耳','同样把右尖角斜向内折。','左右耳朵大致对称。'],
      ['折起下巴','将下方尖角稍向上折，压出平整的下巴。','可以用笔加上眼睛和鼻子。']
    ],
    en:[
      ['Fold the diagonal','Bring the top point down to meet the bottom point.','The long edge is at the top, with both points facing down.'],
      ['Fold the left ear','Bring the left point diagonally inward, moving both layers.','The ear points down.'],
      ['Fold the right ear','Repeat on the right side.','The two ears are roughly symmetrical.'],
      ['Fold up the chin','Fold the bottom point up a short way to make a flat chin.','You can draw eyes and a nose on the finished face.']
    ]
  },
  cup: {
    group:'objects',
    names:['纸杯','Paper cup'],
    details:['一张方纸 · 对齐纸边','One square · Align the edges'],
    cn:[
      ['沿对角线折','把下方尖角向上折，与上方尖角对齐。','长边在下，两个尖角在上。'],
      ['把左角折向右边','把左尖角送到右边缘，上边压出一条水平线。','新形成的上边与底边平行。'],
      ['把右角折向左边','把右尖角折向左侧，对齐刚折出的水平边。','左右两个纸片在正面重叠。'],
      ['放下前面的顶角','捏住前面一层顶角，沿杯口向下折。','后面的顶角仍然朝上。'],
      ['把后层折到背面','将剩下的顶角沿同一条线向背面折。轻撑杯口即可。','两侧杯唇已压平，中央可以张开。']
    ],
    en:[
      ['Fold the diagonal','Bring the bottom point up to meet the top point.','The long edge is at the bottom, with both points facing up.'],
      ['Fold the left corner across','Bring the left point to the right edge and flatten the flap.','Its finished top edge runs parallel to the bottom edge.'],
      ['Fold the right corner across','Bring the right point to the left end of the horizontal edge.','The two flaps overlap on the front.'],
      ['Fold the front point down','Take the front layer only and fold it down along the rim.','One point is still standing at the back.'],
      ['Fold the rear layer back','Fold the remaining point away from you along the same line. Gently open the rim.','Both lips lie flat and the center opens into a cup.']
    ]
  },
  bookmark: {
    group:'objects',
    names:['书角','Corner bookmark'],
    details:['一张方纸 · 学会塞折','One square · Learn the tuck'],
    en:[
      ['Fold along the diagonal','Take the bottom point and fold it up so it meets the top point.','Press flat to make a two-layer triangle.'],
      ['Fold down the front layer','Take just the front point and fold it to the center of the bottom edge.','The back point stays up. The front fold makes the pocket.'],
      ['Lift the right corner','Fold both layers on the right toward the top point.','The right edge lines up with the center.'],
      ['Tuck the right point','Curve the lifted right point down between the front and back walls.','Use Cutaway to see where the point goes.'],
      ['Lift the left corner','Bring both layers on the left toward the top point.','The right point stays inside the pocket.'],
      ['Tuck the left point and flatten','Tuck the left point into the same pocket and gently press it flat.','Both points are inside. Slip the bookmark over a page corner.']
    ]
  },
  ...studioCourses
};

export const copy = {
  brand:['折纸手帖','PaperFold Studio'],
  library:['折纸课程','Fold something'],
  search:['搜索作品','Search projects'],
  share:['分享 App','Share app'], copied:['已复制官网链接','Download link copied'],
  copyManually:['选中下面的官网链接并复制。','Select and copy the download link below.'],
  noResults:['没有找到作品。试试别的关键词或分类。','No projects found. Try a different search or category.'],
  all:['全部','All'], animals:['动物','Animals'], nature:['花与自然','Nature'],
  playCategory:['可以玩','Play'], objects:['实用小物','Useful'], filters:['课程分类','Lesson categories'],
  intro:['拿一张正方形纸，跟着 3D 模型完成第一件作品。','Grab a square of paper and follow the 3D model to your first finished fold.'],
  navBack:['← 课程库','← Lessons'], resume:['继续上次课程','Resume lesson'],
  done:['已完成','Completed'], mark:['标记为已完成','Mark complete'],
  focus:['练习塞入口袋','Practice the tuck'],
  front:['正面','Front'], angle:['斜视','Angled'], side:['侧面','Side'], back:['背面','Back'],
  solid:['实体','Solid'], xray:['透视','X-ray'], spread:['分层','Layers'], cutaway:['剖视','Cutaway'],
  backWall:['后壁','Back wall'], frontWall:['前壁','Front wall'], moving:['活动纸角','Moving point'],
  mouth:['袋口','Opening'], tipStop:['纸尖落点','Point ends here'],
  drag:['拖纸角折叠 · 拖空白处旋转 · 双指缩放','Drag the point to fold · Drag the scene to orbit · Pinch to zoom'],
  open:['撑开袋口','Open pocket'], tuck:['塞入纸角','Tuck point'], flatten:['压平','Flatten'],
  current:['当前折法','Current fold'], check:['对照','Check'], progress:['本步进度','Step progress'],
  prev:['← 上一步','← Previous'], next:['下一步 →','Next →'],
  pause:['Ⅱ　暂停演示','Ⅱ　Pause'], play:['▶　自动演示全程','▶　Play all folds'],
  continue:['▶　从这里继续演示','▶　Play from here'], restart:['↺　重新演示全程','↺　Replay all folds'],
  replay:['▶　继续重播','▶　Resume replay'],
  handle:['拖动纸角折叠，也可用方向键调整','Drag the point to fold, or use the arrow keys'],
  no3d:['无法启动 3D 画面，请重新打开折纸手帖。','The 3D scene could not start. Reopen PaperFold Studio to try again.'],
  reload:['重新加载','Reload'],
  minus:['缩小模型','Zoom out'], plus:['放大模型','Zoom in']
};
