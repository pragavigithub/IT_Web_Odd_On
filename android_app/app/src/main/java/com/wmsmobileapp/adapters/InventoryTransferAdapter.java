package com.wmsmobileapp.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.wmsmobileapp.R;
import com.wmsmobileapp.models.InventoryTransfer;
import java.util.ArrayList;
import java.util.List;

public class InventoryTransferAdapter extends RecyclerView.Adapter<InventoryTransferAdapter.ViewHolder> {
    
    private List<InventoryTransfer> transfers = new ArrayList<>();
    
    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_inventory_transfer, parent, false);
        return new ViewHolder(view);
    }
    
    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.bind(transfers.get(position));
    }
    
    @Override
    public int getItemCount() {
        return transfers.size();
    }
    
    static class ViewHolder extends RecyclerView.ViewHolder {
        private TextView transferNumberText;
        private TextView statusText;
        private TextView fromWarehouseText;
        private TextView toWarehouseText;
        
        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            transferNumberText = itemView.findViewById(R.id.transfer_number);
            statusText = itemView.findViewById(R.id.status);
            fromWarehouseText = itemView.findViewById(R.id.from_warehouse);
            toWarehouseText = itemView.findViewById(R.id.to_warehouse);
        }
        
        public void bind(InventoryTransfer transfer) {
            transferNumberText.setText(transfer.getTransferNumber());
            statusText.setText(transfer.getStatus());
            fromWarehouseText.setText("From: " + transfer.getFromWarehouse());
            toWarehouseText.setText("To: " + transfer.getToWarehouse());
        }
    }
}