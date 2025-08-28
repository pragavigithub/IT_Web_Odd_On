package com.wmsmobileapp.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.wmsmobileapp.R;
import com.wmsmobileapp.models.GRPODocument;
import java.util.ArrayList;
import java.util.List;

/**
 * Adapter for GRPO Documents RecyclerView
 * Displays list of Goods Receipt against Purchase Orders
 */
public class GRPOAdapter extends RecyclerView.Adapter<GRPOAdapter.GRPOViewHolder> {
    
    private List<GRPODocument> grpoList;
    
    public GRPOAdapter() {
        this.grpoList = new ArrayList<>();
        // TODO: Load real data from API
        loadSampleData();
    }
    
    @NonNull
    @Override
    public GRPOViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_grpo, parent, false);
        return new GRPOViewHolder(view);
    }
    
    @Override
    public void onBindViewHolder(@NonNull GRPOViewHolder holder, int position) {
        GRPODocument grpo = grpoList.get(position);
        holder.bind(grpo);
    }
    
    @Override
    public int getItemCount() {
        return grpoList.size();
    }
    
    private void loadSampleData() {
        // Sample data for testing
        grpoList.add(new GRPODocument("GRPO001", "PO12345", "Draft", "2025-07-24"));
        grpoList.add(new GRPODocument("GRPO002", "PO12346", "Submitted", "2025-07-24"));
        grpoList.add(new GRPODocument("GRPO003", "PO12347", "Approved", "2025-07-23"));
    }
    
    public void updateData(List<GRPODocument> newGrpoList) {
        this.grpoList.clear();
        this.grpoList.addAll(newGrpoList);
        notifyDataSetChanged();
    }
    
    static class GRPOViewHolder extends RecyclerView.ViewHolder {
        private TextView grpoNumberText;
        private TextView poNumberText;
        private TextView statusText;
        private TextView dateText;
        
        public GRPOViewHolder(@NonNull View itemView) {
            super(itemView);
            grpoNumberText = itemView.findViewById(R.id.grpo_number);
            poNumberText = itemView.findViewById(R.id.po_number);
            statusText = itemView.findViewById(R.id.status);
            dateText = itemView.findViewById(R.id.date);
        }
        
        public void bind(GRPODocument grpo) {
            grpoNumberText.setText(grpo.getGrpoNumber());
            poNumberText.setText("PO: " + grpo.getPoNumber());
            statusText.setText(grpo.getStatus());
            dateText.setText(grpo.getDate());
            
            // Set status color
            int statusColor;
            switch (grpo.getStatus()) {
                case "Draft":
                    statusColor = itemView.getContext().getColor(R.color.status_draft);
                    break;
                case "Submitted":
                    statusColor = itemView.getContext().getColor(R.color.status_submitted);
                    break;
                case "Approved":
                    statusColor = itemView.getContext().getColor(R.color.status_approved);
                    break;
                default:
                    statusColor = itemView.getContext().getColor(R.color.status_default);
                    break;
            }
            statusText.setTextColor(statusColor);
        }
    }
}