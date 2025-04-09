import type { AuthInfo } from '../../QuickPage-Builder-AI-core/src/types/global'

const authInfo: AuthInfo = {
  token: '123456',
  expires: 1677721600000,
  userInfo: {
    userId: '1',
    userName: 'admin',
    roles: ['admin']
  }
}

interface DemoItem {
  id: number
  itemName: string
  url: string
}

const demoList: DemoItem[] = [
  {
    id: 1,
    itemName: 'Bottomfiling',
    url: 'Bottomfiling'
  },
  {
    id: 2,
    itemName: 'SmallBoard',
    url: 'SmallBoard'
  }
]

export default {
  'post|/self/item/getSelfServiceItemList': () => {
    return {
      ...authInfo,
      dataList: demoList
    }
  }
}
