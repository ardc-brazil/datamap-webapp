import { useState } from 'react';
import { TabPanel } from "../TabPanel";
import { Tabs } from "../Tabs";

export default function DataExplorer(props) {

  // TODO: Remove with fake data explorer file details
  if (!props.dataset?.dataFiles?.length) {
    props.dataset.dataFiles = [
      { path: "/path/to/a/file1.csv" },
      { path: "/path/to/a/file2.csv" }
    ]
  }

  const [dataExplorerCollapsed, setDataExplorerCollapsed] = useState(false);
  const [selectedFile, setSelectedFile] = useState(props.dataset?.dataFiles?.[0].path ?? null);
  const [loadingTable, setLoadingTable] = useState(false);

  /**
   * Extract the file name from a full path file.
   * @param path full path for the file
   * @returns file name
   * @example
   * - /path/to/a/file.txt -> file.txt
   */
  function fileName(path: string): string {
    const tokens = path.split("/");
    return tokens[tokens.length - 1];
  }

  function handleCollapseDataExplorer(event): void {
    setDataExplorerCollapsed(!dataExplorerCollapsed);
  }

  // function getFakeData() {
  //   const table = [] as number[][];
  //   for (let i = 0; i < 100; i++) {
  //     const row = [];
  //     for (let j = 0; j < 10; j++) {
  //       row.push(j * i);
  //     }
  //     table.push(row);
  //   }

  //   return table;
  // }
  const fakeData = JSON.parse('[["column 0","column 1","column 2","column 3","column 4","column 5","column 6","column 7","column 8","column 9"],[0,0,0,0,0,0,0,0,0,0],[0,1,2,3,4,5,6,7,8,9],[0,2,4,6,8,10,12,14,16,18],[0,3,6,9,12,15,18,21,24,27],[0,4,8,12,16,20,24,28,32,36],[0,5,10,15,20,25,30,35,40,45],[0,6,12,18,24,30,36,42,48,54],[0,7,14,21,28,35,42,49,56,63],[0,8,16,24,32,40,48,56,64,72],[0,9,18,27,36,45,54,63,72,81],[0,10,20,30,40,50,60,70,80,90],[0,11,22,33,44,55,66,77,88,99],[0,12,24,36,48,60,72,84,96,108],[0,13,26,39,52,65,78,91,104,117],[0,14,28,42,56,70,84,98,112,126],[0,15,30,45,60,75,90,105,120,135],[0,16,32,48,64,80,96,112,128,144],[0,17,34,51,68,85,102,119,136,153],[0,18,36,54,72,90,108,126,144,162],[0,19,38,57,76,95,114,133,152,171],[0,20,40,60,80,100,120,140,160,180],[0,21,42,63,84,105,126,147,168,189],[0,22,44,66,88,110,132,154,176,198],[0,23,46,69,92,115,138,161,184,207],[0,24,48,72,96,120,144,168,192,216],[0,25,50,75,100,125,150,175,200,225],[0,26,52,78,104,130,156,182,208,234],[0,27,54,81,108,135,162,189,216,243],[0,28,56,84,112,140,168,196,224,252],[0,29,58,87,116,145,174,203,232,261],[0,30,60,90,120,150,180,210,240,270],[0,31,62,93,124,155,186,217,248,279],[0,32,64,96,128,160,192,224,256,288],[0,33,66,99,132,165,198,231,264,297],[0,34,68,102,136,170,204,238,272,306],[0,35,70,105,140,175,210,245,280,315],[0,36,72,108,144,180,216,252,288,324],[0,37,74,111,148,185,222,259,296,333],[0,38,76,114,152,190,228,266,304,342],[0,39,78,117,156,195,234,273,312,351],[0,40,80,120,160,200,240,280,320,360],[0,41,82,123,164,205,246,287,328,369],[0,42,84,126,168,210,252,294,336,378],[0,43,86,129,172,215,258,301,344,387],[0,44,88,132,176,220,264,308,352,396],[0,45,90,135,180,225,270,315,360,405],[0,46,92,138,184,230,276,322,368,414],[0,47,94,141,188,235,282,329,376,423],[0,48,96,144,192,240,288,336,384,432],[0,49,98,147,196,245,294,343,392,441],[0,50,100,150,200,250,300,350,400,450],[0,51,102,153,204,255,306,357,408,459],[0,52,104,156,208,260,312,364,416,468],[0,53,106,159,212,265,318,371,424,477],[0,54,108,162,216,270,324,378,432,486],[0,55,110,165,220,275,330,385,440,495],[0,56,112,168,224,280,336,392,448,504],[0,57,114,171,228,285,342,399,456,513],[0,58,116,174,232,290,348,406,464,522],[0,59,118,177,236,295,354,413,472,531],[0,60,120,180,240,300,360,420,480,540],[0,61,122,183,244,305,366,427,488,549],[0,62,124,186,248,310,372,434,496,558],[0,63,126,189,252,315,378,441,504,567],[0,64,128,192,256,320,384,448,512,576],[0,65,130,195,260,325,390,455,520,585],[0,66,132,198,264,330,396,462,528,594],[0,67,134,201,268,335,402,469,536,603],[0,68,136,204,272,340,408,476,544,612],[0,69,138,207,276,345,414,483,552,621],[0,70,140,210,280,350,420,490,560,630],[0,71,142,213,284,355,426,497,568,639],[0,72,144,216,288,360,432,504,576,648],[0,73,146,219,292,365,438,511,584,657],[0,74,148,222,296,370,444,518,592,666],[0,75,150,225,300,375,450,525,600,675],[0,76,152,228,304,380,456,532,608,684],[0,77,154,231,308,385,462,539,616,693],[0,78,156,234,312,390,468,546,624,702],[0,79,158,237,316,395,474,553,632,711],[0,80,160,240,320,400,480,560,640,720],[0,81,162,243,324,405,486,567,648,729],[0,82,164,246,328,410,492,574,656,738],[0,83,166,249,332,415,498,581,664,747],[0,84,168,252,336,420,504,588,672,756],[0,85,170,255,340,425,510,595,680,765],[0,86,172,258,344,430,516,602,688,774],[0,87,174,261,348,435,522,609,696,783],[0,88,176,264,352,440,528,616,704,792],[0,89,178,267,356,445,534,623,712,801],[0,90,180,270,360,450,540,630,720,810],[0,91,182,273,364,455,546,637,728,819],[0,92,184,276,368,460,552,644,736,828],[0,93,186,279,372,465,558,651,744,837],[0,94,188,282,376,470,564,658,752,846],[0,95,190,285,380,475,570,665,760,855],[0,96,192,288,384,480,576,672,768,864],[0,97,194,291,388,485,582,679,776,873],[0,98,196,294,392,490,588,686,784,882],[0,99,198,297,396,495,594,693,792,891]]');

  function handleSelectFile(x: any): void {
    setLoadingTable(true);
    setSelectedFile(x.path);

    setTimeout(() => {
      setLoadingTable(false);
    }, 1000);
  }


  function getColumns(dataFiles: any) {
    if (!dataFiles) {
      return 0;
    }
    return dataFiles.length * fakeData[0].length;

  }

  return (
    <div>
      <h4>Data Explorer</h4>
      <div className="flex gap-4 p-2 overflow-x-clip">

        {/* File details */}
        <div className="flex flex-col border border-primary-300 min-w-[448px] w-full">

          {/* Header */}
          <div className="flex p-4 ">
            <div className="w-full bg-primary-50">
              <h6 className="font-semibold">{selectedFile} <span className="text-primary-500 no-underline">(10 MB)</span></h6>
            </div>
            <div className="">
              <button type="button" className="rounded-full h-8 w-8 hover:bg-primary-100 active:bg-primary-200" onClick={handleCollapseDataExplorer}>
                {dataExplorerCollapsed ? "<" : ">"}
              </button>
            </div>
          </div>

          {loadingTable
            ? <p className="text-sm px-4">Loading ...</p>
            : (
              <Tabs className="max-h-[600px]">
                <TabPanel title="Compact">
                  {/* File Details */}
                  <div className=" overflow-scroll max-h-[600px]">
                    <table className="table-auto text-primary-600 font-extralight border-collapse border-spacing-0 border border-primary-200">
                      <thead>
                        <tr className="shadow-sm shadow-primary-700 border border-primary-600 sticky top-0">
                          {fakeData[0].map((columnName, i) =>
                            <th key={i} className="px-3 py-2 whitespace-nowrap text-left font-normal text-sm bg-primary-50 border border-primary-200">{columnName}</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-red-100 whitespace-nowrap">
                        {fakeData.slice(1).map((row, i) =>
                          <tr key={i}>
                            {row.map((col, j) =>
                              <td key={j} className="px-2 py-1 text-left text-sm min-w-[150px] font-mono font-normal border border-primary-200">
                                {col}
                              </td>
                            )}
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </TabPanel>
                <TabPanel title="Columns">
                  <div className="p-4 max-h-[600px] overflow-y-auto">

                    {fakeData[0].map((column, i) =>
                      <div key={i}>
                        <ColumnsCard name={column} value={Math.round(Math.abs(Math.random() * i) * 1000)} />
                        <hr />
                      </div>
                    )}

                  </div>
                </TabPanel>
              </Tabs>
            )
          }

        </div>

        {/* Data Explorer */}
        <div className={`${dataExplorerCollapsed && "hidden"} flex flex-col min-w-[200px] w-72`}>
          <div>
            <h6 className="font-semibold">Data explorer</h6>
            <span className="text-sm underline">
              Version 1
            </span>
            {" "}
            <span className="text-primary-500 no-underline">(100 MB)</span>
          </div>

          {/* files list */}
          <div className="h-full">
            <ul className="list-none py-2 overflow-x-auto">
              {props.dataset.dataFiles?.map((x, i) => (
                <li className={`${selectedFile === x.path ? "bg-primary-200" : "hover:bg-primary-100"} text-sm text-primary-500 font-light whitespace-nowrap my-1`} key={i} onClick={() => handleSelectFile(x)}>
                  <div className="flex gap-2 items-center py-1 cursor-pointer">
                    <img src="/img/icon-file.svg" className="w-4 h-4" />
                    <p className="text-sm py-0 my-0">{fileName(x.path)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <hr />
          <div className="pt-4">
            <h6 className="font-semibold">Summary</h6>
            <ul className="list-none py-2 overflow-x-auto">
              <li className={`text-sm text-primary-500 font-light whitespace-nowrap my-1`}>
                <div className="flex gap-2 items-center py-1">
                  <img src="/img/icon-folder.svg" className="w-4 h-4" />
                  <p className="text-sm py-0 my-0">{props.dataset?.dataFiles?.length ?? 0} files</p>
                </div>
              </li>
              <li className={`text-sm text-primary-500 font-light whitespace-nowrap my-1`}>
                <div className="flex gap-2 items-center py-1">
                  <img src="/img/icon-columns.svg" className="w-4 h-4" />
                  <p className="text-sm py-0 my-0">{getColumns(props.dataset?.dataFiles) ?? 0} columns</p>
                </div>
              </li>
            </ul>
          </div>
          <hr />
        </div>

      </div>
    </div>
  )

  function ColumnsCard(props) {
    return <div className="flex py-4">
      <div className="w-full flex flex-col justify-between items-start">
        <h6 className="font-semibold py-2">{props.name}</h6>
        <p className="text-2xl font-semibold py-8">
          {props.value}
          <br />
          <span className="text-xl font-semibold">
            total values
          </span>
        </p>

      </div>
      <div className="w-1/3 text-xs">
        <ul>
          <DataLine name="Valid" value="187" percent="100%" />
          <DataLine name="Mismatched" value="0" percent="0%" />
          <DataLine name="Mission" value="0" percent="0" />
          <DataLine />
          <DataLine name="Mean" value="934" percent="" />
          <DataLine name="Std. Deviation" value="3.45" percent="" />
          <DataLine />
          <DataLine name="Quantiles" value="0" percent="Min" />
          <DataLine name="" value="0" percent="25%" />
          <DataLine name="" value="0" percent="50%" />
          <DataLine name="" value="0" percent="75%" />
          <DataLine name="" value="0" percent="Max" />
        </ul>
      </div>
    </div>;
  }

  function DataLine(props) {
    return <li className="flex">
      <div className="w-full font-bold">
        {props?.name ?? (<span>&nbsp;</span>)}
      </div>
      <div className="w-32 font-semibold text-right pr-3 text-primary-700">
        {props.value}
      </div>
      <div className="w-16 text-right text-primary-700">
        {props.percent}
      </div>
    </li>;
  }
}
