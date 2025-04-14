import type { AuthInfo } from '../../QuickPage-Builder-AI-core/src/types/global'
import type { TempInfoData } from '../../QuickPage-Builder-AI-core/src/types/dnd'

const authInfo: AuthInfo = {
  token: '123456',
  expires: 1677721600000,
  userInfo: {
    userId: '1',
    userName: 'admin',
    roles: ['admin']
  }
}
const TempInfo: TempInfoData = {
  ...authInfo,
  tempId: 1,
  dataList: {
    id: 1,
    content: '[]'
  }
}
// const getTempInfo: ComponentItem[] = [
//   {
//     title: 'Bottomfiling',
//     key: '1',
//     url: 'Bottomfiling',
//     minWidth: 24,
//     minHeight: 2,
//     width: 24,
//     height: 2,
//     editTitle: false,
//     positionX: 0,
//     positionY: 0,
//     selfServiceData: {
//       id: 1,
//       itemName: 'Bottomfiling',
//       url: 'Bottomfiling'
//     },
//     treeKey: '0-0-0_1',
//     ccs: '1 / 1 / 3 / 25'
//   },
//   {
//     title: 'SmallBoard',
//     key: '2',
//     url: 'SmallBoard',
//     minWidth: 6,
//     minHeight: 3,
//     width: 6,
//     height: 3,
//     editTitle: false,
//     positionX: 0,
//     positionY: 0,
//     selfServiceData: {
//       id: 2,
//       itemName: 'SmallBoard',
//       url: 'SmallBoard'
//     },
//     treeKey: '0-0-1_2',
//     ccs: '4 / 10 / 7 / 16'
//   }
// ]

export default {
  'post|/self/homePageInfo/getTempInfo': () => {
    return {
      ...TempInfo
    }
  }
}
