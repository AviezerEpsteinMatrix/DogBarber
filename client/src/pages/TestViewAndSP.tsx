import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { getMyHistory, getAppointmentsView } from "../api";
import type { CustomerHistory, AppointmentView, AxiosErrorResponse } from "../api";
import { useToast } from "../components/Toast";
import { dictionary } from "../dictionary";

export default function TestViewAndSP() {
  const { showToast } = useToast();
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  const [viewData, setViewData] = useState<AppointmentView[]>([]);
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);

  const handleTestHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await getMyHistory();
      setHistory(data);
      showToast("History נטען בהצלחה", "success");
    } catch (error) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as AxiosErrorResponse).response?.data?.message
          : undefined;
      const errorMsg = message || "שגיאה בטעינת History";
      setHistoryError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTestView = async () => {
    setViewLoading(true);
    setViewError(null);
    try {
      const date = filterDate ? filterDate.toDate() : undefined;
      const data = await getAppointmentsView(date);
      setViewData(data);
      showToast("View נטען בהצלחה", "success");
    } catch (error) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as AxiosErrorResponse).response?.data?.message
          : undefined;
      const errorMsg = message || "שגיאה בטעינת View";
      setViewError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setViewLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return dictionary.noData;
    return dayjs(dateString).format("DD/MM/YYYY HH:mm");
  };

  const formatPrice = (price: number) => {
    return `₪${price.toFixed(2)}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        component="h1"
        fontWeight="bold"
        sx={{ color: "white", mb: 3 }}
      >
        {dictionary.testViewAndSpTitle}
      </Typography>

      <Grid container spacing={3}>
        {/* History Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {dictionary.historyResults}
              </Typography>
              <Button
                variant="contained"
                onClick={handleTestHistory}
                disabled={historyLoading}
                sx={{ mt: 1 }}
              >
                {historyLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  dictionary.testHistoryButton
                )}
              </Button>
            </Box>

            {historyError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {historyError}
              </Alert>
            )}

            {history && (
              <Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>{dictionary.bookingCount}:</strong> {history.bookingCount}
                </Typography>
                <Typography variant="body1">
                  <strong>{dictionary.lastAppointmentDate}:</strong>{" "}
                  {formatDate(history.lastAppointmentDate)}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* View Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {dictionary.viewResults}
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label={dictionary.filterByDate}
                  value={filterDate}
                  onChange={(date) => setFilterDate(date)}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { minWidth: 200, mb: 2 },
                    },
                  }}
                />
              </LocalizationProvider>
              <Button
                variant="contained"
                onClick={handleTestView}
                disabled={viewLoading}
                sx={{ mt: 1, display: "block" }}
              >
                {viewLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  dictionary.testViewButton
                )}
              </Button>
            </Box>

            {viewError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {viewError}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* View Results Table */}
        {viewData.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                {dictionary.viewResults} ({viewData.length})
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>{dictionary.userId}</TableCell>
                      <TableCell>{dictionary.username}</TableCell>
                      <TableCell>{dictionary.firstName}</TableCell>
                      <TableCell>{dictionary.email}</TableCell>
                      <TableCell>GroomingTypeId</TableCell>
                      <TableCell>{dictionary.dogSize}</TableCell>
                      <TableCell>{dictionary.price}</TableCell>
                      <TableCell>{dictionary.duration} ({dictionary.minutes})</TableCell>
                      <TableCell>{dictionary.dateAndTime}</TableCell>
                      <TableCell>{dictionary.createdAt}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.userId}</TableCell>
                        <TableCell>{item.userName || "-"}</TableCell>
                        <TableCell>{item.firstName || "-"}</TableCell>
                        <TableCell>{item.email || "-"}</TableCell>
                        <TableCell>{item.groomingTypeId}</TableCell>
                        <TableCell>
                          {item.dogSize ? (
                            <Chip label={item.dogSize} size="small" />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{formatPrice(item.price)}</TableCell>
                        <TableCell>{item.durationMinutes}</TableCell>
                        <TableCell>{formatDate(item.appointmentDate)}</TableCell>
                        <TableCell>{formatDate(item.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

