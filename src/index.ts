import { queryAndSaveStrategies, queryAndSaveStrategyReportedEventLogs } from "@/src/lib/yusnd";

async function main() {
  // Get most recent strategy reported event logs
  await queryAndSaveStrategyReportedEventLogs();
  await queryAndSaveStrategies();
}

main()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  })